# webGLite

An approximate in some ways accurate in others TypeScript version of the classic BBC Micro game Elite that makes use of WebGL.

Obviously massive amounts of credit go the original authors of the game: David Braben and Ian Bell. I was blown away by this game on launch (1984?) and played it for staggering numbers of hours. I suspect its the game I've dedicated the most time to. The more I learn about how it works and just how much is going on the more blown away I am by how they managed to get all this running on an 8-bit micro. Its truly astounding. Even conceiving of this as a possibility on an 8-bit... just wow. 

In addition I am **heavily** indebted to Mark Moxon and his project to document the source code and inner workings. Its as much of a work of art as the original game. Just wonderful stuff. I don't think I'd have contemplated this without that.

https://www.bbcelite.com

I'm trying to use similar terminology in the code as is used on his website. The hope being that this is a useful expression of at least some of it in a friendly language.

I'll probably do some writing about this implementation over on my blog:

https://www.jamesdrandall.com

## Running the Game

Should be as simple as:

    npm install
    npm start

If its not.... log an issue and I'll see what I can do!

## Current Status

Early days. Bits and pieces are up and running but with lots left to figure out. Expect the code to twist around a lot in the coming weeks. I've done stuff with WebGL before but never a space game and there are definitely a couple of challenges in here (to my humble brain anyway).

If my previous retro-remake type work is anything to go by expect me to blunder around a lot: I'm neither a games programmer or a maths guy. I get by!

Beyond finishing the game obvious to dos include:

1. Move shaders to load from external files
2. Rationalise the WebGL code - I've got a consistent view of what I'm doing now and this can be massively flattened now 

## Ship Models

The original ship format is a bit weird to a modern general purpose renderer however Ian Bell (one of the original authors, we're not worthy we're not worthy) maintains an archive of files which include the ship models in VRML format.

http://www.elitehomepage.org/archive/index.htm

The ship models in this demo / conversion come from taking those VRML files and running them through a converter to Wavefront Obj format which is then pretty straightforward to load into vertex and index buffers in WebGL.

## Timings

In the original game things like acceleration aren't modelled in terms of meters per second. Instead times are expressed in terms of cycles through the main game loop. This worked fine for the original game which was running on fixed hardware but doesn't really work on modern hardware.

I've approximated the feel of the original game by recording myself playing Elite in BeebEm and then figuring out how long it takes to do accelerate to match speed, pitch, roll etc. And then time how long it takes to travel a distance on the scanner etc.

I think I've landed in the right ballpark but due to its approach to timing and the very limited hardware available at the time the frame rate can vary wildly and this impacts how long it takes to get through the main loop. So the time to accelerate to max speed is impacted by, for example, how many objects are on the screen.

## The scanner

I'm currently rendering the scanner in 3D using a texture however this leads to its "dirty" look as we are looking at it obliquely. Alternatives to consider:

0. Keep playing with the texture - I've just had a go at tweaking it based on knowing how it will be displayed, its yielded some improvement.
1. See if it looks any better rendered as a 3D model (i.e. draw the circle and lines using triangles)
2. Render it in 2D

## Font

The font is pretty much the original BBC Micro font. Not sure I've got the spacing quite right as it should be 40 characters across and I'm 38ish characters across but it looks about right which is the main thing!

## World space

Elite uses 23 bit numbers + 1 bit for the sign for ship co-ordinates. So +/- 23-bits. This is represented as:

    x = (x_sign x_hi x_lo)
    y = (y_sign y_hi y_lo)
    z = (z_sign z_hi z_lo)

The player is always at position (0,0,0) and the world "revolves", quite literally, around them.

The scanner shows shipBlueprint that have a high byte that is < 63 (0x33) and so to be in range the shipBlueprint must have co-ordinates:

    x > -0x3300 and x < 0x3300
    y > -0x3300 and x < 0x3300
    z > -0x3300 and x < 0x3300

## Planet textures

I sourced the textures for the planets from here:

https://www.solarsystemscope.com/textures/

Super cool and, handily, licensed under the CC Attribution license.

## Ship spawning (trader, pirate etc.)

The game looks to spawn a ship every 256 times through its main loop (and then applies some random chance).

From videoing and observing the game it appears to be running on average between 10 and 20 fps depending on how much is on screen.

So 256 times through the loop will take around 17 seconds (256/15). We're starting by using that as the basis for spawning in this version.

This is set, and changeable, in the constants file.

The spawning is covered in the main game loop parts 1 to 6:

https://www.bbcelite.com/master/main/subroutine/main_game_loop_part_1_of_6.html

## Audio

The audio is all from the original game with the exception of the Blue Danube which is CC licensed from here:

https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA

## License

Obviously the original game, code, ship models, names, etc. is copyright the original authors and copyright owners.

From looking at other Elite variants.... OOLite is GPL and CC.

And so in terms of the TypeScript code here: I've licensed it under the Creative Commons Attribution-NonCommercial-ShareAlike license. Basically you can copy, use it, modify it but you can't sell it and anything you create has to be under the same license.

I figured that was the best way to license the code for a homage such as this.
