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

## Ship Models

The original ship format is a bit weird to a modern general purpose renderer however Ian Bell (one of the original authors, we're not worthy we're not worthy) maintains an archive of files which include the ship models in VRML format.

http://www.elitehomepage.org/archive/index.htm

The ship models in this demo / conversion come from taking those VRML files and running them through a converter to Wavefront Obj format which is then pretty straightforward to load into vertex and index buffers in WebGL.

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

The scanner shows ships that have a high byte that is < 63 (0x33) and so to be in range the ships must have co-ordinates:

    x > -0x3300 and x < 0x3300
    y > -0x3300 and x < 0x3300
    z > -0x3300 and x < 0x3300



## Possible planet shaders

Still trying to decide how to render planets and stars... simple shapes or something more complex... will decide later. In the meantime here are some cool shaders I'm gathering.

https://www.shadertoy.com/view/ls2Bzd

https://www.shadertoy.com/view/wsGBzR

## License

Obviously the original game, code, ship models, names, etc. is copyright the original authors and copyright owners.

From looking at other Elite variants.... OOLite is GPL and CC.

And so in terms of the TypeScript code here: I've licensed it under the Creative Commons Attribution-NonCommercial-ShareAlike license. Basically you can copy, use it, modify it but you can't sell it and anything you create has to be under the same license.

I figured that was the best way to license the code for a homage such as this.
