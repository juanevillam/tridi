// Sube un video (#/upload): browser-first local MediaPipe capture (works 24/7 with zero server /
// Mac tunnel dependency) + optional GPU server mode for high-accuracy 3D (GVHMR + WiLoR), .zip
// batches, multi-person chooser, and RL policy training.
import { chooseSubject, fetchClip, firstFrameUrl, UploadError, uploadVideo, watchJob } from '../../../data/live/src/upload.js';
import { appHeaderHTML, mountAppHeader } from '../header.js';
import { createVideoOverlay } from '../video-overlay.js';
import { addUserClip } from '../preloaded.js';
import { cannotTrain, mountTrainBox, startTraining, trainBoxHTML } from '../training.js';
import { escapeHtml } from '../i18n.js';
import { A, T } from './strings/upload.js';

export { title } from './strings/upload.js';

const MAX_BYTES = 60 * 1024 * 1024;
const MAX_SECONDS = 30;
const VIDEO_TYPES = /\.(mp4|mov|m4v|webm|zip)$/i;

const STAGES = [
  ['upload', 'stageUpload'],
  ['tracking', 'stageTracking'],
  ['pose3d', 'stagePose'],
  ['done', 'stageDone'],
];
const STAGE_ORDER = { waiting: 1, tracking: 1, pose3d: 2, done: 3, failed: 3 };

// Survives leaving the screen while a server job is running.
let session = null;

const describeError = (error) => (error instanceof UploadError ? escapeHtml(error.message) : T('lost'));

function videoSeconds(file) {
  return new Promise((resolve) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(probe.src);
      resolve(probe.duration);
    };
    probe.onerror = () => resolve(null);
    probe.src = URL.createObjectURL(file);
  });
}

export function mount(root, { api }) {
  root.innerHTML = `
    <section class="page upload" data-step="pick">
      ${appHeaderHTML({ current: 'upload' })}
      <div class="upload-grid">
        <section class="pane example-pane">
          <p class="pane-label"><span class="only-wide">${T('exampleWide')}</span><span class="only-narrow">${T('exampleNarrow')}</span></p>
        </section>
        <div class="upload-panel">
          <div data-show="checking"><p class="lead">${T('connecting')}</p></div>

          <div data-show="pick">
            <div class="upload-mode-bar">
              <div class="upload-mode-toggle" role="group" ${A({ 'aria-label': 'modeAria' })}>
                <button type="button" class="upload-mode-btn" data-engine="local" aria-pressed="true">${T('modeLocal')}</button>
                <button type="button" class="upload-mode-btn" data-engine="server" aria-pressed="false" disabled>${T('modeServer')}</button>
              </div>
              <p class="upload-server-hint">${T('serverStatusOff')}</p>
            </div>
            <p class="lead">${T('pickLead')}</p>
            <ul class="tips">
              <li>${T('tipSide')}</li>
              <li>${T('tipLimits', { seconds: MAX_SECONDS, mb: MAX_BYTES / 1024 / 1024 })}</li>
              <li>${T('tipPeople')}</li>
            </ul>
            <label class="dropzone">
              <input type="file" accept="video/*,.zip" hidden />
              <strong>${T('pickButton')}</strong>
              <span>${T('drop')}</span>
            </label>
            <p class="pick-error error" aria-live="polite"></p>
          </div>

          <div data-show="uploading">
            <h2 class="upload-heading">${T('uploading')}</h2>
            <p class="note upload-sub" aria-live="polite"></p>
            <div class="track big"><div class="bar upload-bar"></div></div>
            <p class="upload-percent">0 %</p>
            <button class="cancel" type="button">${T('cancel')}</button>
          </div>

          <div data-show="processing">
            <h2>${T('watching')}</h2>
            <ol class="stages">${STAGES.map(([id, text]) => `<li data-stage="${id}">${T(text)}</li>`).join('')}</ol>
            <div class="track big"><div class="bar stage-bar"></div></div>
            <p class="queue"></p>
            <div class="chooser" hidden>
              <p>${T('isThis')}</p>
              <div class="frame"><img ${A({ alt: 'frameAlt' })} /><svg></svg></div>
            </div>
            <p class="note">${T('meanwhile')}</p>
          </div>

          <div data-show="done">
            <h2>${T('done')}</h2>
            <p class="lead done-text"></p>
            ${trainBoxHTML()}
            <div class="row">
              <a class="button primary see-clip" href="/simulations">${T('seeSim')}</a>
              <button class="upload-gpu-btn" type="button" hidden>${T('sendToServer')}</button>
              <button class="again" type="button">${T('again')}</button>
              <a class="button" href="/">${T('home')}</a>
            </div>
          </div>

          <div data-show="error">
            <h2>${T('failedHead')}</h2>
            <p class="lead error error-text"></p>
            <button class="primary again" type="button">${T('tryAnother')}</button>
          </div>

          <div data-show="off">
            <h2>${T('offHead')}</h2>
            <p class="lead"><span class="only-wide">${T('offWide')}</span><span class="only-narrow">${T('offNarrow')}</span></p>
            <div class="row">
              <button class="primary retry" type="button">${T('retry')}</button>
              <a class="button" href="/live">${T('useCamera')}</a>
              <a class="button" href="/delivery">${T('seeDelivery')}</a>
            </div>
            <p class="note server-url"></p>
          </div>
        </div>
      </div>
    </section>`;

  const $ = (selector) => root.querySelector(selector);
  const page = $('.upload');
  const trainBox = mountTrainBox($('.train-box'), api);
  const show = (step) => (page.dataset.step = step);

  // Example walk with skeleton overlay in the left pane.
  const example = createVideoOverlay($('.example-pane'));
  example.show('clip_2026-10-23_caminar-perfil_01').catch(console.error);
  let exampleTime = 0;
  let exampleLast = performance.now();
  let exampleFrame = requestAnimationFrame(function tick(now) {
    exampleTime += (now - exampleLast) / 1000;
    exampleLast = now;
    example.sync(exampleTime, true, 1);
    exampleFrame = requestAnimationFrame(tick);
  });

  let gone = false;
  let abort = null;
  let engine = 'local'; // 'local' (24/7 browser MediaPipe) | 'server' (optional GPU server)
  let lastLocalFile = null;

  const engineBtns = [...root.querySelectorAll('.upload-mode-btn')];
  const serverBtn = root.querySelector('[data-engine="server"]');
  const gpuBtn = $('.upload-gpu-btn');

  function setEngine(next) {
    engine = next;
    for (const b of engineBtns) b.setAttribute('aria-pressed', String(b.dataset.engine === next));
  }
  for (const b of engineBtns) {
    b.onclick = () => {
      if (!b.disabled) setEngine(b.dataset.engine);
    };
  }

  // Picking a file.
  const input = $('input[type=file]');
  input.onchange = () => input.files[0] && start(input.files[0]);
  const zone = $('.dropzone');
  zone.ondragover = (event) => {
    event.preventDefault();
    zone.classList.add('over');
  };
  zone.ondragleave = () => zone.classList.remove('over');
  zone.ondrop = (event) => {
    event.preventDefault();
    zone.classList.remove('over');
    const file = event.dataTransfer.files[0];
    if (file) start(file);
  };
  for (const button of root.querySelectorAll('.again')) {
    button.onclick = () => {
      session = null;
      lastLocalFile = null;
      gpuBtn.hidden = true;
      input.value = '';
      $('.pick-error').innerHTML = '';
      show('pick');
    };
  }
  $('.cancel').onclick = () => abort?.abort();
  gpuBtn.onclick = () => {
    if (lastLocalFile && api.ok) startServer(lastLocalFile);
  };

  async function start(file) {
    const refuse = (markup) => ($('.pick-error').innerHTML = markup);
    refuse('');
    if (!VIDEO_TYPES.test(file.name)) return refuse(T('notVideo'));
    if (file.size > MAX_BYTES) return refuse(T('tooBig', { mb: Math.round(file.size / 1024 / 1024), max: MAX_BYTES / 1024 / 1024 }));
    const isZip = /\.zip$/i.test(file.name);
    if (!isZip) {
      const seconds = await videoSeconds(file);
      if (seconds > MAX_SECONDS) return refuse(T('tooLong', { seconds: Math.round(seconds), max: MAX_SECONDS }));
    }

    if (isZip) {
      if (!api.ok) return refuse(T('zipNeedsServer'));
      return startServer(file);
    }

    if (engine === 'server' && api.ok) {
      return startServer(file);
    }
    return startLocal(file);
  }

  async function startLocal(file) {
    lastLocalFile = file;
    session = null;
    abort?.abort();
    abort = new AbortController();
    $('.upload-heading').innerHTML = T('watching');
    $('.upload-sub').innerHTML = T('localLoading');
    $('.upload-bar').style.width = '0%';
    $('.upload-percent').textContent = '0 %';
    show('uploading');

    try {
      const { extractPoseClipFromVideo } = await import('tridi-live');
      const clip = await extractPoseClipFromVideo(file, {
        signal: abort.signal,
        onProgress: ({ stage, progress }) => {
          if (gone) return;
          if (stage === 'model') {
            $('.upload-sub').innerHTML = T('localLoading');
          } else {
            const pct = Math.round(100 * progress);
            $('.upload-sub').innerHTML = T('localExtracting');
            $('.upload-bar').style.width = `${pct}%`;
            $('.upload-percent').textContent = `${pct} %`;
          }
        },
      });
      if (gone) return;
      const name = file.name.replace(/\.[^.]+$/, '');
      addUserClip(clip, name);
      $('.done-text').innerHTML = T('doneLocal');
      $('.see-clip').href = `/simulations/${encodeURIComponent(clip.id)}`;
      gpuBtn.hidden = !api.ok;
      const item = { clip: clip.id, data: clip };
      if (api.ok) trainBox.show(item);
      show('done');
    } catch (error) {
      if (abort.signal.aborted || error?.name === 'AbortError') {
        if (!gone) show('pick');
        return;
      }
      console.error(error);
      fail(T('nobody'));
    }
  }

  async function startServer(file) {
    session = { filename: file.name, jobId: null, job: null, clips: [] };
    gpuBtn.hidden = true;
    $('.upload-heading').innerHTML = T('uploading');
    $('.upload-sub').innerHTML = '';
    $('.upload-bar').style.width = '0%';
    $('.upload-percent').textContent = '0 %';
    show('uploading');
    abort?.abort();
    abort = new AbortController();
    try {
      session.jobId = await uploadVideo(api.url, file, {
        signal: abort.signal,
        onProgress: ({ sent, total }) => {
          const percent = Math.round((100 * sent) / total);
          $('.upload-bar').style.width = `${percent}%`;
          $('.upload-percent').textContent = `${percent} %`;
        },
      });
    } catch (error) {
      if (abort.signal.aborted) {
        session = null;
        return show('pick');
      }
      return fail(describeError(error));
    }
    follow();
  }

  function fail(markup) {
    session = { ...session, error: markup };
    if (gone) return;
    $('.error-text').innerHTML = markup;
    show('error');
  }

  async function follow() {
    abort?.abort();
    abort = new AbortController();
    const signal = abort.signal;
    if (!gone) show('processing');
    let job;
    try {
      job = await watchJob(api.url, session.jobId, { signal, onUpdate: (state) => !gone && render((session.job = state)) });
    } catch (error) {
      if (!signal.aborted) fail(describeError(error));
      return;
    }
    const failed = job.videos.filter((v) => v.stage === 'failed');
    if (job.state === 'failed' || failed.length === job.videos.length) {
      return fail(failed[0]?.error ? escapeHtml(failed[0].error) : T('nobody'));
    }
    try {
      session.clips = await Promise.all(job.videos.filter((v) => v.clip_id).map((v) => fetchClip(api.url, v.clip_id)));
    } catch (error) {
      return fail(describeError(error));
    }
    const name = session.filename.replace(/\.[^.]+$/, '');
    session.clips.forEach((clip, i) => addUserClip(clip, session.clips.length > 1 ? `${name} (${i + 1})` : name));
    if (gone) return;
    $('.done-text').innerHTML = session.clips.length > 1 ? T('doneMany', { n: session.clips.length }) : T('doneOne');
    const item = { clip: session.clips[0].id, data: session.clips[0] };
    $('.see-clip').href = `/simulations/${encodeURIComponent(session.clips[0].id)}`;
    trainBox.show(item);
    if (!cannotTrain(item, api)) startTraining(item, api);
    show('done');
    render(job);
  }

  function render(job) {
    const videos = job.videos;
    const step = Math.min(...videos.map((v) => STAGE_ORDER[v.stage] ?? 1));
    root.querySelectorAll('.stages li').forEach((li, i) => {
      li.classList.toggle('done', i < step || (i === step && step === 3));
      li.classList.toggle('current', i === step && step < 3);
    });
    const current = videos.find((v) => (STAGE_ORDER[v.stage] ?? 1) === step) ?? videos[0];
    $('.stage-bar').style.width = `${Math.round(100 * (current?.progress ?? 0))}%`;
    $('.queue').innerHTML =
      job.state === 'queued' && job.position > 0
        ? job.position === 1 ? T('aheadOne') : T('aheadMany', { n: job.position })
        : videos.length > 1
          ? T('ready', { done: videos.filter((v) => v.stage === 'done').length, total: videos.length })
          : '';
    drawChooser(job);
  }

  let chooserFor = null;
  function drawChooser(job) {
    const n = job.videos.findIndex((v) => v.people?.length && v.frame_size);
    const chooser = $('.chooser');
    chooser.hidden = n < 0 || job.videos[n].people.length < 2;
    if (chooser.hidden) return;
    const video = job.videos[n];
    const [w, h] = video.frame_size;
    const img = chooser.querySelector('img');
    const key = `${job.job_id}/${n}/${video.first_frame}`;
    if (chooserFor !== key) {
      img.src = firstFrameUrl(api.url, job.job_id, n);
      chooserFor = key;
    }
    const svg = chooser.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = video.people
      .map(({ box: [x0, y0, x1, y1], selected }) =>
        `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${Math.min(w, h) / 80}" class="${selected ? 'selected' : ''}" />`)
      .join('');
    svg.onclick = async (event) => {
      const rect = svg.getBoundingClientRect();
      const x = Math.round(((event.clientX - rect.left) / rect.width) * w);
      const y = Math.round(((event.clientY - rect.top) / rect.height) * h);
      try {
        await chooseSubject(api.url, job.job_id, n, x, y);
      } catch (error) {
        return fail(describeError(error));
      }
      follow();
    };
  }

  const showServer = () =>
    ($('.server-url').innerHTML = api.url ? T('server', { url: escapeHtml(api.url) }) : T('serverOff'));
  $('.retry').onclick = async () => {
    $('.retry').disabled = true;
    $('.retry').innerHTML = T('trying');
    const ok = await api.recheck();
    $('.retry').disabled = false;
    $('.retry').innerHTML = T('retry');
    showServer();
    if (!gone && ok) {
      serverBtn.disabled = false;
      $('.upload-server-hint').innerHTML = T('serverStatusOn');
      show('pick');
    }
  };

  // Never block #/upload on server check: local browser mode is ready immediately.
  // Enable the optional GPU server toggle if/when the tunnel server responds.
  api.checked.then((ok) => {
    if (gone) return;
    showServer();
    serverBtn.disabled = !ok;
    $('.upload-server-hint').innerHTML = ok ? T('serverStatusOn') : T('serverStatusOff');
    if (ok && session?.error) return fail(session.error);
    if (ok && session?.jobId) return follow();
  });

  const unHeader = mountAppHeader(root);
  return () => {
    unHeader();
    gone = true;
    abort?.abort();
    cancelAnimationFrame(exampleFrame);
    example.dispose();
    trainBox.dispose();
  };
}
