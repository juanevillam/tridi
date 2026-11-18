// Headless verification of Tasks P-1 (Hardware Catalog & CRUD), P-2 (luigi_lab4 MuJoCo Digital Twin),
// P-3 (Assembler .ino parser + MJCF generator), and P-4 (Industrial Factory Cell in MuJoCo).
import { readFileSync } from 'node:fs';
import {
  getComponent,
  getPreset,
  listComponents,
  registerComponent,
  removeComponent,
  validateHardwarePinout,
} from '../components/index.js';
import { classifyStlMeshes, generateMujocoXml, parseArduinoSketch } from '../src/assembler.js';
import {
  generateIsaEngineeringDocs,
  generatePidMujocoXml,
  generatePlcFlatFile,
  parseDxfPid,
  PID_SAMPLE_DXFS,
} from '../src/pid_assembler.js';
import * as ort from '../src/onnx-lite.js';
import { createPolicy } from '../src/policy.js';
import { loadG1Node } from './node-model.mjs';

const failures = [];
const assert = (cond, msg) => {
  if (!cond) failures.push(msg);
};

// 1. P-1: Hardware Component Catalog, CRUD & Timer/Pin Guardrails
const allComponents = listComponents();
assert(allComponents.length >= 10, `expected >= 10 catalog components, got ${allComponents.length}`);
assert(getComponent('sg90_servo')?.mujoco?.kp === 4.5, 'sg90_servo kp should be 4.5');
assert(getComponent('sg90_servo')?.mcu?.upstream_pins?.length === 3, 'sg90_servo should have 3 Wokwi upstream pins');
assert(getComponent('arduino_uno')?.mcu?.upstream_pins?.length >= 20, 'arduino_uno should have Wokwi upstream pins');
assert(getComponent('tt_gearmotor_200rpm')?.mcu?.deadzone_pwm === 115, 'tt_gearmotor_200rpm deadzone_pwm should be 115');

const custom = registerComponent({
  id: 'custom_tof_vl53l1x',
  name: 'VL53L1X Long-Range Laser ToF (4m)',
  category: 'distance_sensor',
  mujoco: { sensor_type: 'rangefinder', max_range_m: 4.0, mass_kg: 0.002 },
  mcu: { bus: 'I2C', i2c_address: '0x29' },
});
assert(custom.bucket === 'sensors' && getComponent('custom_tof_vl53l1x')?.name.includes('VL53L1X'), 'CRUD registerComponent failed');
assert(removeComponent('custom_tof_vl53l1x') && !getComponent('custom_tof_vl53l1x'), 'CRUD removeComponent failed');

const lab4Preset = getPreset('luigi_lab4');
const validLab4 = validateHardwarePinout('arduino_uno', lab4Preset.pinout);
assert(validLab4.valid && validLab4.interruptMode === 'INT1_hardware_isr', `luigi_lab4 pinout should be valid with INT1_hardware_isr: ${JSON.stringify(validLab4)}`);

const badTimer1 = validateHardwarePinout('arduino_uno', { ...lab4Preset.pinout, ENA: 10, SERVO: 9 });
assert(!badTimer1.valid && badTimer1.errors.some((e) => e.includes('Timer1 conflict')), 'expected Timer1 conflict when ENA=10 and SERVO=9');

// 2. P-3: Parse real Luigi Lab 4 Arduino sketch & generate MuJoCo XML
const lab4InoPath = new URL('../models/luigi_lab4/firmware/LAB4_Robot_Explorador_Autonomo.ino', import.meta.url).pathname;
const parsedIno = parseArduinoSketch(readFileSync(lab4InoPath, 'utf8'));
assert(parsedIno.hasServo && parsedIno.pinout.SERVO === 9, `expected SERVO=9 from LAB4 .ino, got ${parsedIno.pinout.SERVO}`);
assert(parsedIno.pinout.ENA === 5 && parsedIno.pinout.ENB === 6 && parsedIno.pinout.ECHO === 3, `unexpected LAB4 pinout: ${JSON.stringify(parsedIno.pinout)}`);
assert(parsedIno.bottlenecks.length >= 2, 'expected pulseIn and delay bottlenecks detected in LAB4 .ino');

const roles = classifyStlMeshes(['1_chasis_robot.stl', '5_rin_x2.stl', '6_llanta_x2_TPU.stl', '7_cabeza_sensor_servo.stl']);
assert(roles.some((r) => r.role === 'servo_turret'), 'expected 7_cabeza_sensor_servo.stl classified as servo_turret');

// 3. P-1 3D Component Previews + P-2: Load standalone 3D component XMLs and luigi_lab4/scene.xml in MuJoCo WASM
const { sim } = await loadG1Node();
for (const comp of allComponents) {
  const mjcf = comp.preview_mjcf;
  assert(Boolean(mjcf), `missing preview_mjcf on ${comp.id}`);
  sim.load(mjcf, 'home');
  assert(sim.model.nq === 1 && sim.model.nu === 1, `3D component preview ${mjcf} (${comp.id}) expected nq=1 nu=1`);
}
sim.load('luigi_lab4/scene.xml', 'home');
assert(sim.model.nq === 10 && sim.model.nu === 3, `luigi_lab4 expected nq=10 nu=3, got nq=${sim.model.nq} nu=${sim.model.nu}`);

sim.data.ctrl[0] = 15.0;
sim.data.ctrl[1] = 15.0;
sim.data.ctrl[2] = 1.1; // +63 deg left neck sweep
for (let i = 0; i < 30; i++) await sim.advance(1 / 60);
const xAfterForward = sim.data.qpos[0];
const neckLeft = sim.data.qpos[9];

sim.data.ctrl[2] = -1.1; // -63 deg right neck sweep
for (let i = 0; i < 30; i++) await sim.advance(1 / 60);
const neckRight = sim.data.qpos[9];

assert(xAfterForward > 0.05, `luigi_lab4 did not drive forward (x=${xAfterForward.toFixed(3)} m)`);
assert(neckLeft > 0.45 && neckRight < -0.45, `luigi_lab4 SG90 neck did not sweep (left=${neckLeft.toFixed(2)} rad, right=${neckRight.toFixed(2)} rad)`);
console.log(`P-2 luigi_lab4: drove x=${xAfterForward.toFixed(3)} m, neck swept +${(neckLeft * 180 / Math.PI).toFixed(1)}° to ${(neckRight * 180 / Math.PI).toFixed(1)}°`);

// 3b. J-4: Verify trained luigi-lab4.onnx policy (obs_dim=18, nu=3) runs in onnx-lite.js + policy.js
const lab4MetaPath = new URL('../../training/policies/luigi-lab4.json', import.meta.url);
const lab4OnnxPath = new URL('../../training/policies/luigi-lab4.onnx', import.meta.url);
const lab4Meta = JSON.parse(readFileSync(lab4MetaPath, 'utf8'));
const lab4Onnx = new Uint8Array(readFileSync(lab4OnnxPath));
sim.load('luigi_lab4/scene.xml', 'home');
const lab4Policy = await createPolicy(ort, sim, lab4Onnx, lab4Meta);
sim.policy = lab4Policy;
sim.reset();
for (let i = 0; i < 45; i++) await sim.advance(1 / 60);
assert(sim.data.qpos[0] > 0.05, `luigi-lab4.onnx policy did not advance robot (x=${sim.data.qpos[0].toFixed(3)} m)`);
assert(Boolean(sim.sensorReadout) && sim.sensorReadout.distCm > 0, 'luigi-lab4.onnx policy did not populate sensorReadout');
console.log(`J-4 luigi-lab4.onnx: drove x=${sim.data.qpos[0].toFixed(3)} m at 50 Hz (obs_dim=${lab4Meta.obs_dim}, nu=${lab4Meta.nu})`);
sim.policy = null;
lab4Policy.dispose();

// Verify P-3 generated XML loads into MuJoCo WASM using the luigi_lab4 mesh assets
const assembled = generateMujocoXml({ preset: 'luigi_lab4', modelName: 'assembled_lab4' });
sim.files['luigi_lab4/assembled_lab4.xml'] = new TextEncoder().encode(assembled.robotXml);
sim.files['luigi_lab4/assembled_scene.xml'] = new TextEncoder().encode(assembled.sceneXml);
sim.load('luigi_lab4/assembled_scene.xml', 'home');
assert(sim.model.nq === 10 && sim.model.nu === 3, 'assembled_lab4 XML failed nq=10 nu=3 check');
console.log(`P-1 & P-3 assembler: ${allComponents.length} catalog components, parsed LAB4 .ino (${parsedIno.bottlenecks.length} bottlenecks), compiled valid MuJoCo XML`);

// 4. P-4: Load factory_cell/scene.xml in MuJoCo WASM and test timed conveyor + pusher + sealer + factory-cell.onnx policy
sim.load('factory_cell/scene.xml', 'home');
assert(sim.model.nq === 10 && sim.model.nu === 3, `factory_cell expected nq=10 nu=3, got nq=${sim.model.nq} nu=${sim.model.nu}`);
const factoryMeta = JSON.parse(readFileSync(new URL('../../training/policies/factory-cell.json', import.meta.url), 'utf8'));
const factoryOnnx = new Uint8Array(readFileSync(new URL('../../training/policies/factory-cell.onnx', import.meta.url)));
const factoryPolicy = await createPolicy(ort, sim, factoryOnnx, factoryMeta);
sim.policy = factoryPolicy;
sim.reset();
for (let i = 0; i < 45; i++) await sim.advance(1 / 60);
assert(Boolean(sim.factoryReadout) && sim.factoryReadout.feedMm > 150, 'factory-cell.onnx policy did not populate factoryReadout');
sim.policy = null;
factoryPolicy.dispose();

sim.reset();
sim.data.ctrl[0] = 0.55; // advance package along conveyor
sim.data.ctrl[1] = 0.14; // extend pneumatic pusher gate
sim.data.ctrl[2] = 0.12; // lower vertical sealer press
for (let i = 0; i < 45; i++) await sim.advance(1 / 60);
const feedPos = sim.data.qpos[7];
const pusherPos = sim.data.qpos[8];
const sealerPos = sim.data.qpos[9];
assert(feedPos > 0.25 && pusherPos > 0.08 && sealerPos > 0.06, `factory_cell actuators did not reach targets (${feedPos.toFixed(2)}, ${pusherPos.toFixed(2)}, ${sealerPos.toFixed(2)})`);
console.log(`P-4 factory_cell: conveyor=${feedPos.toFixed(2)} m, pusher=${pusherPos.toFixed(2)} m, sealer=${sealerPos.toFixed(2)} m`);

// 5. J-6: Verify P&ID (.dxf) Parser, ISA-5.1 Docs Generator, 3D Plant MuJoCo XML & PLC Flat-File Exporter
for (const sampleId of ['01_batch_mixer.dxf', '02_silo_packaging.dxf', '06_pilot_plant_hydromet.dxf']) {
  const sample = PID_SAMPLE_DXFS[sampleId];
  const dag = parseDxfPid(sample.dxf, { fileName: sampleId });
  assert(dag.nodes.length >= 12, `${sampleId}: expected >= 12 ISA-5.1 tags, got ${dag.nodes.length}`);
  assert(dag.sourceVerification.verified, `${sampleId}: verifyPidSources failed (${JSON.stringify(dag.sourceVerification)})`);
  const docs = generateIsaEngineeringDocs(dag, { lang: 'en' });
  assert(docs.markdown.includes('FUNCTIONAL DESIGN SPECIFICATION') && docs.causeEffectMatrix.length === 4, `${sampleId}: ISA FDS docs incomplete`);
  assert(docs.ioCsv.includes('PLC_Symbolic_Tag,ISA_5_1_Tag') && docs.ioCsvFileName.endsWith('.csv'), `${sampleId}: PLC I/O CSV export missing`);
  const plc = generatePlcFlatFile(dag);
  assert(
    plc.scl.includes('FB_Motor_Standard') &&
      plc.scl.includes('DATA_BLOCK "BatchDB"') &&
      plc.l5k.includes('ADD_ON_INSTRUCTION_DEFINITION FB_Valve_Standard'),
    `${sampleId}: PLC flat-file export incomplete`,
  );
  const pid3d = generatePidMujocoXml(dag);
  const xmlPath = `factory_cell/${pid3d.modelName}.xml`;
  sim.files[xmlPath] = new TextEncoder().encode(pid3d.sceneXml);
  sim.load(xmlPath, 'home');
  assert(sim.model.nq === 10 && sim.model.nu === 3, `${sampleId}: compiled 3D P&ID XML expected nq=10 nu=3, got nq=${sim.model.nq} nu=${sim.model.nu}`);
}

// Verify flexible plant alias parser (TANK 5, BV15, PP6, AOD1, FILTER PRESS 1, pH Sensor & Level sensor footnotes)
const rawAliasText = `
  PILOT PLANT ON SCALE P&ID
  TANK 3 5cuM WASTE ACIDIC SOLUTION
  TANK 5 200L PRECIP
  BV15 BV27 PP6 AOD1 FILTER PRESS 1 SIR 1
  pH Sensor for TANK 5: METTLER-TOLEDO M300
  Level sensors for tanks: 3, 5, 9, 10, 12
`;
const aliasDag = parseDxfPid(rawAliasText, { fileName: 'pilot_plant_ocr.txt' });
assert(aliasDag.nodes.some((n) => n.tag === 'TK-05'), 'expected TANK 5 -> TK-05');
assert(aliasDag.nodes.some((n) => n.tag === 'FV-BV15'), 'expected BV15 -> FV-BV15');
assert(aliasDag.nodes.some((n) => n.tag === 'P-PP06'), 'expected PP6 -> P-PP06');
assert(aliasDag.nodes.some((n) => n.tag === 'P-AOD01'), 'expected AOD1 -> P-AOD01');
assert(aliasDag.nodes.some((n) => n.tag === 'PK-FP01'), 'expected FILTER PRESS 1 -> PK-FP01');
assert(aliasDag.nodes.some((n) => n.tag === 'AT-05'), 'expected pH Sensor for TANK 5 -> AT-05');
assert(aliasDag.nodes.some((n) => n.tag === 'LT-12'), 'expected Level sensors footnote -> LT-12');
assert(aliasDag.sourceVerification.verified, `aliasDag verifyPidSources failed: ${JSON.stringify(aliasDag.sourceVerification)}`);
console.log('J-6 pid_assembler: parsed 01_batch_mixer.dxf, 02_silo_packaging.dxf & 06_pilot_plant_hydromet.dxf + flexible plant aliases, verified 100% ISA-5.1 tags');

sim.delete();
if (failures.length) {
  console.error(`check-assembler failed: ${failures.join('; ')}`);
  process.exit(1);
}
console.log('check-assembler passed');
