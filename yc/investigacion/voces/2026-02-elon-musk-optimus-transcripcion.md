# Transcripción cruda: Elon Musk sobre humanoides y Optimus (Dwarkesh Patel, feb 2026)

- Video: [Elon Musk – "In 36 months, the cheapest place to put AI will be space"](https://youtu.be/BYXbuik3dgA?t=4642), Dwarkesh Patel, publicado el 2026-02-05.
- Tramo: de 1:17:00 a 1:30:40. El bloque de robots va de 1:17:22 a 1:30:21.
- La hicimos con whisper.cpp (`large-v3-turbo`) sin corrección manual, así que puede tener errores de transcripción. Las marcas de tiempo son del video completo.
- El resumen y lo que aplica a Tridi están en [`2026-02-elon-musk-optimus.md`](2026-02-elon-musk-optimus.md).

[1:17:00] That would be much worse than if all of the cells in your spreadsheet were calculated by

[1:17:03] the computer.

[1:17:04] And so really what will happen is the pure AI, pure robotics corporations or collectives

[1:17:15] will far outperform any corporations that have humans in the loop and this will happen

[1:17:20] very quickly.

[1:17:21] Speaking of closing the loop, sorry, Optimus, you, I mean, as far as like manufacturing

[1:17:29] targets and so forth go, your companies have sort of been like carrying American manufacturing

[1:17:35] of hard tech on their back.

[1:17:39] But in the fields that you are, you know, Tesla has been dominant in your, and now you want

[1:17:45] to go into humanoids in China, there's entire dozens and dozens of companies that are doing

[1:17:51] this kind of manufacturing cheaply and at scale and are incredibly competitive.

[1:17:57] So give us sort of like advice or a plan of how America can build the humanoid armies

[1:18:03] or, you know, the EVs, et cetera at scale and as cheaply as China is on track to.

[1:18:10] Well, there are really only three hard things for human robots.

[1:18:14] The, the real world intelligence, the, the hand and scale manufacturing.

[1:18:21] Yeah.

[1:18:22] Um, so, uh, I haven't seen any, even demo robots that have a great hand, like with all the degrees

[1:18:31] of freedom of a human hand, but Optimus will have that.

[1:18:37] Um, Optimus does have that.

[1:18:39] And how do you achieve that?

[1:18:40] Is it just like right torque density in the motor?

[1:18:41] Like what is the, what is the hardware bottleneck to that?

[1:18:43] Well, we had to, we had to design custom, custom actuators, um, basically custom designed, um, motors, gears, uh, power electronics, controls, sensors, everything had to be designed from physics first principles.

[1:19:00] There is no supply chain for this.

[1:19:01] And will we be able to manufacture those at scale?

[1:19:02] Yes.

[1:19:03] Is anything hard to accept the hand from a manipulation point of view or once you've solved the hand, are you, are you good?

[1:19:07] From an electromechanical standpoint, the, uh, the hand is more difficult than everything else combined.

[1:19:11] Yeah.

[1:19:12] Human hand turns out to be quite something, um, but, but then you also need the real world intelligence.

[1:19:17] Um, so the intelligence that tells us to develop for the car, um, applies very well to the robot.

[1:19:30] Um, which is, you know, primarily vision in, but the car takes more vision, but also it actually

[1:19:36] also is listening for sirens.

[1:19:38] It's, um, you know, it's, it's taking in the initial measurements.

[1:19:41] It's GPS signals, a whole bunch of other data, uh, combining that with, with video was primarily

[1:19:46] video and then, uh, outputting the, um, control command.

[1:19:51] So like, like Tesla is taking in one and a half gigabytes a second of video, uh, and outputting two kilobytes a second of control.

[1:19:59] Control, control outputs, um, with the video at 36, uh, hertz and the control frequency at 18.

[1:20:07] One intuition you could have, um, for when we get this robotic stuff is that it takes quite a few years to go from the compelling demo to actually being able to use in the real world.

[1:20:19] So 10 years ago you had really compelling demos of self-driving, but only now we have RoboTaxi and Waymo and all these services scaling up.

[1:20:27] Doesn't this, shouldn't this make one pessimistic on, say household robots?

[1:20:33] Because we don't even quite have the compelling demos yet of say the really advanced hand.

[1:20:38] Well, we've been working on, uh, humanoid robots now for awhile.

[1:20:42] Um, so I guess it's been five or six years or something like that.

[1:20:47] Um, and, um, and a bunch of things that we've done for the car are applicable to the robot.

[1:20:53] Um, so we'll use the same, um, Tesla AI chips in the, in the, in the robot as the car.

[1:21:01] Uh, we'll use it with the same basic principles.

[1:21:04] Uh, it's, it's, it's very much the same, uh, AI.

[1:21:07] Um, you've got, you know, many more degrees of freedom for a robot than you do for a car.

[1:21:11] Um, but it really, if you just think of it for like, as, as like a bootstream, um, AI is really mostly, uh, compression and correlation of, of two bootstreams.

[1:21:20] So you're, you know, so you, for video, you've got to do a tremendous amount of compression.

[1:21:25] Um, and, and, uh, the, and you've got to do the compression just right.

[1:21:30] You've got to compress the, like, ignore the, the things that don't matter.

[1:21:35] And, and like, you don't care about the details of the leaves and the tree on the side of the road, but you care a lot about the, um, the road signs and the traffic lights and the pedestrians.

[1:21:45] And, and even whether, you know, someone in another, another car is, is looking at you or not looking at you.

[1:21:50] Like these, there's some of these, some of these details matter a lot.

[1:21:53] So if it is essentially, it's, it's got to turn that.

[1:21:56] Well, the car is going to turn at one and a half gigabytes a second, ultimately into two kilobytes a second of control outputs.

[1:22:01] Um, so many stages of compression.

[1:22:04] Um, and you've got to get all those stages right.

[1:22:07] And then correlate those to the correct control outputs.

[1:22:10] And the robot has to do essentially the same thing.

[1:22:12] And you think about what, what humans, this is what happens with humans.

[1:22:15] We're, we're really are photons in controls out.

[1:22:18] So that, that is the vast majority of your, your life has been vision, photons in, and then motor controls out.

[1:22:27] Naively, it seems like between humanoid robots and cars, the, the fundamental actuators in a car are like how you turn, how you accelerate, et cetera.

[1:22:36] Right.

[1:22:37] Where in a robot, especially with maneuverable arms, there's dozens and dozens of these degrees of freedom.

[1:22:42] And then especially with Tesla, you had this advantage of like, you had millions and millions of hours of human demo data collected from just the car being out there.

[1:22:50] Where like you can't equivalently just deploy optimists that don't work and then get the data that way.

[1:22:54] So between the increased degrees of freedom and far sparser data.

[1:22:59] Yes.

[1:23:00] That's a good point.

[1:23:01] How will you, how will you use the sort of Tesla engine of intelligence on, to train the optimist mind?

[1:23:10] Now you're, you're actually, you're highlighting an important limitation and difference between cars.

[1:23:15] It's like, we, we do have, we'll still have like 10 million cars on the road.

[1:23:19] Um, and so, uh, that's, it's, it's, it's hard to duplicate that like massive training fly, flywheel, um, for, for the robot, um, what we're going to need to do is build a lot of robots and put them in kind of like an optimist academy.

[1:23:37] So they can do self play in reality.

[1:23:39] Um, so we're, we're actually getting, we're actually pulling that out.

[1:23:42] So we're going to have at least 10,000 optimist robots, maybe 20 or 30,000 that can do that, that are doing self play and, and, and testing different tasks.

[1:23:52] And then, uh, the, the Tesla, um, has quite a good, uh, reality generator, uh, like a physics accurate reality generated that we, we made, made this for the cars.

[1:24:04] We'll do the same thing for the robots and, um, actually have done that for the robots.

[1:24:08] Um, so, uh, so you, you have, you know, a few tens of thousands of humanoid robots, uh, doing different tasks.

[1:24:17] And then you've got, you can do millions of simulated robots in the simulated world.

[1:24:22] And you use the, uh, the tens of thousands of, of robots in the real world to close the simulation to reality gap, close the sim to real gap.

[1:24:31] How do you think about the synergies, uh, between XAI and Optimus, given you were highlighting, look, you need this world model.

[1:24:37] You maybe want to use some really smart intelligence as the control plane.

[1:24:41] Um, and so maybe Grok is like doing the slower planning and then like the motor policy is at the lower level.

[1:24:46] Right.

[1:24:47] Yeah.

[1:24:48] What will the sort of synergy between these things be?

[1:24:51] Yeah.

[1:24:52] So you'd use Grok would orchestrate the behavior of the Optimus robots.

[1:24:57] So let's say you wanted to build a factory.

[1:25:01] Um, the, then Optimus, then Grok could, uh, organize the Optimus robots, give them, assign them tasks, uh, to build the factory for, to produce whatever you want.

[1:25:15] Don't you need to merge XAI and Tesla then? Cause these things end up so...

[1:25:19] What were we saying earlier about public company discussions?

[1:25:22] Well, we're one more Guinness in, Leland.

[1:25:27] Um, what, what are you waiting to see before you just say, we want to manufacture a hundred thousand Optimus? Is it like...

[1:25:33] Optimize.

[1:25:34] Since, since we're defining the, the proper noun, we could define the, the plural of the proper noun too.

[1:25:40] So we, we, we're, we're going to prop it on the plural and so it's optimized.

[1:25:43] Okay.

[1:25:44] Um, is there something on the hardware side you want to see?

[1:25:47] Do you want to see better actuators or is it just, you want the software to be better?

[1:25:50] What are we waiting for before we get like mass manufacturing of Gen 3?

[1:25:53] No, we're moving towards that.

[1:25:54] We're, we're going forward with mass manufacturing.

[1:25:57] But you think current, um, current hardware is good enough that you are going to, you should, you just want to deploy as many as possible now?

[1:26:04] I mean, it's very hard to scale our production.

[1:26:07] I said.

[1:26:08] Uh, but, uh, yeah, but I, I think Optimus 3 is the right version of the robot to, you know, to, to produce maybe something on the order of like a million units a year.

[1:26:20] I think you'd want to go to Optimus 4 before you went to 10 million units a year.

[1:26:23] Okay.

[1:26:24] But you can do a million a year at Optimus 3.

[1:26:25] Uh, yeah.

[1:26:26] I mean, it's very hard to spool up manufacturing.

[1:26:28] Yes.

[1:26:29] Um, so like manufacturing, uh, um, like the, the output per unit time is always follows an S curve.

[1:26:38] Yeah.

[1:26:39] So it starts off agonizingly slow.

[1:26:40] Then it has this sort of.

[1:26:41] We eventually put that.

[1:26:42] We eventually put that.

[1:26:43] Exponential increase, then a linear, then a, then a, you know, logarithmic outcome until you sort of eventually asymptoted some number.

[1:26:50] But Optimus initial production will be, it's going to be a, it's going to be a stretched out S curve because so much of what goes into Optimus is brand new.

[1:26:59] There's not an existing supply chain.

[1:27:01] Um, as I mentioned, the, the actuators, electronics, everything in the Optimus robot is designed, um, for physics first principles.

[1:27:09] It's not, it's not taken from a catalog.

[1:27:11] These, these are custom designed everything.

[1:27:14] Literally everything.

[1:27:15] I don't think there's a single thing that, um.

[1:27:17] How far down does that go?

[1:27:19] I mean, I guess we're not making custom capacitors yet.

[1:27:23] Maybe, um, but, um, but there's, there's nothing you can pick out of a catalog, um, at any price.

[1:27:32] Uh, so, so it just means that the, the, the Optimus S curve, uh, the, the, the, the units, units per, output per unit time.

[1:27:43] You know, how many office robots do you make per per day?

[1:27:46] Uh, whatever is, is gonna initially ramp, uh, slower than a product where you have an existing supply chain.

[1:27:54] Um, but it will get to a million.

[1:27:56] When, when you see these Chinese humanoids, uh, like Unitree or whatever, sells humanoids for like 6k or 13k.

[1:28:02] Do you just like, are you hoping to get your Optimus's bill of materials below that price so you can, uh, do the same thing?

[1:28:10] Or do you just think qualitatively they're not the same thing?

[1:28:12] Like, what, what do you think is going, like, what allows it, what allows it to sell for so low?

[1:28:16] And can we match that?

[1:28:18] Well, Optimus, our Optimus is designed to have a lot of intelligence.

[1:28:22] Um, and, um, to have the same electromechanical dexterity, if not higher than a human.

[1:28:28] So Unitree does not have that.

[1:28:31] And it's also, I mean, it's, it's, it's quite a, it's quite a big robot.

[1:28:35] It's just, it's, it has to do, uh, you know, carry heavy objects for long periods of time.

[1:28:42] Um, and not overheat or exceed the power of its actuators.

[1:28:45] So, um, so we've got, we've got, we've got, you know, it's, it's 511.

[1:28:51] You know, it's just pretty tall, um, and it's, it's got a lot of intelligence.

[1:28:57] So it's going to be more expensive than, um, a small robot that is not intelligent.

[1:29:02] But more capable.

[1:29:03] Yeah.

[1:29:04] But not a lot more.

[1:29:05] I mean, like, the thing is, over time, as Optimus robots build Optimus robots, the, the cost

[1:29:10] will drop, uh, very quickly.

[1:29:12] Yeah.

[1:29:13] And what will these first billion Optimuses, Optimai, do?

[1:29:16] Like, what will their highest and best use be?

[1:29:18] Uh, I think that you, you would start off with, with simple tasks that you can count on them

[1:29:22] doing well.

[1:29:23] But in the home or in factories, like?

[1:29:25] The, the best use for, um, robots in the beginning will be anything, any, um, continuous

[1:29:32] operation.

[1:29:33] So any 24 by 7 operation, cause then you're, cause they can, they can work continuously.

[1:29:36] Yeah.

[1:29:37] What, what fraction of the work at a Gigafactory that is currently done by humans could a Gen 3 do?

[1:29:41] Yeah.

[1:29:42] Um, I'm not, I'm not sure.

[1:29:43] Maybe it's like 10, 20%.

[1:29:46] Maybe more.

[1:29:47] I don't know.

[1:29:48] That's it.

[1:29:49] We would, we would use, we would not like reduce our head count.

[1:29:52] We would, we would, for sure.

[1:29:54] It can increase our head count to be clear.

[1:29:55] Right.

[1:29:56] Um, but, but we would increase our output.

[1:29:58] So the, the, um, units produced per human, like total, total number of humans at Tesla will

[1:30:05] increase, but the, um, the output of robots and cars will increase, will increase disproportionate,

[1:30:12] like much, much to, you know, uh, number of cars and robots produced per human will increase

[1:30:19] dramatically.

[1:30:20] But number of humans will increase as well.

[1:30:22] Yeah.

[1:30:23] We're talking about Chinese manufacturing, um, a bunch here.

[1:30:27] And, um, we're also talking about, you know, we've talked about some of the policies that

[1:30:33] are relevant, like you mentioned, the, uh, the solar tariffs.

[1:30:36] Yeah.

[1:30:37] Uh, and you think they're a bad idea because, you know, we can't.
