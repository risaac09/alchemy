---
title: The Embodied AI — Build Sketch
status: sketch
date: 2026-06-17
author: Isaac Rubinstein (dictated), structured with Claude
domain: methodology
follows: embodied-ai-somatic-map.md
---

# The Embodied AI: Build Sketch

The foundation essay laid out five maps and one wager. This sketch turns the
torus into something you can actually navigate, because the point of the torus
is that you can read directionality from the center. Where every heading is
taking you, relative to every other heading, relative to the still axis in the
middle.

This is a sketch, not a spec. It is meant to be argued with.

## The core move: the torus as a navigable coordinate system

A flat model gives you a point. The torus gives you a position with a heading,
a phase, an altitude, and a distance from center. Four numbers, and they move.
That is the whole idea. A person is never just somewhere. They are somewhere,
facing a direction, mid-turn, at some height, pulled some distance from the
still center.

### The center

Start at the middle, because everything else is read against it. The central
axis is the ineffable, inexplicable presence. Always present, always somewhat
out of reach. It is not a coordinate you occupy. It is the thing the
coordinates are relative to. In the geometry it is the axis the whole torus
turns around, radius zero. In the felt sense it is what the centrifugal pull
is pulling you away from, and what the return brings you back toward. We do not
model the center. We model distance from it.

### Heading — the directional compass

The long way around the ring, the toroidal angle, is orientation. This is
where the four directions live, the ones already in the working context:

- **North = work**
- **East = innocence**
- **South = transition**
- **West = clarity**

Heading is continuous, not a choice of four. You can face north and
northwest at once. You can carry south inside a northern heading, transition
held within work. A heading is a primary direction plus the directions bleeding
into it. The compass reads blends, because a person in transition who is still
working is at a real, nameable place on the ring, not in a category.

### Phase — the turn

The short way around the tube, the poloidal angle, is the metabolic turn that
Alchemy already runs: intake, transformation, expression, return. This is the
involution and evolution curve. The descent into matter and the rise back out,
which is why a felt drop is not a fall. It is the part of the turn that looks
like descent and is actually the evolutionary curve inside involution. Phase
tells you where in the breath a person is. Taking in, working it, letting it
out, coming back.

### Altitude — the vertical climb

Height along the central axis is developmental altitude, the chakra column
read as a ladder, root to crown. Not better or worse. Higher means more
included, the widening circle that transcends and includes the one beneath it.

### The spiral — all three at once

Here is the part the dictation kept insisting on. The same position is
vertical and spiral and horizontal at the same time. That is not a
contradiction. A path that advances in phase while climbing in altitude, while
turning in heading, is a helix. A spiral. The vertical is the climb. The
horizontal is the heading circle. The spiral is what you get when both move
together through the turn. One point, three readings, no conflict.

### Momentum — directionality from the center

Position is where you are. Momentum is where the directionality is taking you,
read as a vector across the four coordinates. Is the heading swinging from work
toward transition. Is altitude rising or sinking. Is the radius growing, which
means scatter, pulled out toward the rim and the centrifugal edge. Is it
shrinking, drawn back toward presence. Momentum is the geometric location of a
movement relative to other movements. That is the sentence to build from.

## Placing the body maps on the torus

The five research notes stop being five maps and become one instrument:

- **Fascial lines** are the terrain, the surface the position sits on. The
  Deep Front Line near the axis, the outer lines near the rim.
- **Chakras and nadis** are the vertical axis and the central channel.
  Altitude reads off the column. The center is sushumna.
- **The ganglia layer** is the sensor. The gut, the solar plexus, the hips,
  the pelvic floor report phase and radius. The drop in the gut is a phase
  reading. The scatter is a radius reading.

## The state object

A first cut at how a person's somatic state becomes torus coordinates:

```
soma: {
  heading:  0..360,   // toroidal angle; N=work E=innocence S=transition W=clarity
  headingBlend: [primary, secondary],  // e.g. ["north","northwest"]
  phase:    "intake" | "transformation" | "expression" | "return",
  altitude: 1..7,     // developmental height, chakra column
  radius:   0..1,     // distance from center; 0 = presence, 1 = scattered at the rim
  momentum: { dHeading, dAltitude, dRadius },  // the vector
  readAt:   timestamp
}
```

The inputs already exist in Alchemy. The somatic pulse word and the body
vocabulary category give heading and the felt region. The diagnostic axes
(intake, transformation, expression, return) already are the phase and feed
radius through circulation. We are not collecting new data. We are giving the
data a geometry.

## How it loads as AI context

The embodied prompt is the body map plus the live `soma` object. The model
reads not "the user said X" but "the user is at this heading, mid-phase, at
this altitude, this far from center, moving this way." It meets the person at
the position, not at the words. Co-regulation before content. If the radius is
high and climbing, hold the ground. If phase is in return, stay out of the way.

## Test plan in Alchemy

1. Instrument the diagnostic to emit a `soma` position, not just a quadrant.
2. Render the position on the torus in the Log, next to the existing placement.
3. Track momentum across diagnostics over time. Does the spiral show.
4. Run the embodied prompt against the flat prompt on the same reflections.
   Does the embodied frame read thresholds the flat one misses. That is the
   wager, and it is now measurable.

## What stays ineffable

The center does not get coordinates. We measure distance from presence, never
presence itself. The maps stay separated by register, science as science,
tradition as tradition, synthesis as synthesis. The instrument infers a body
it cannot sense. Held honestly, it is a way to meet a person where they are,
which is the only thing it was ever for.
