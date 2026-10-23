# Clock-Out: Career Fair Cart

A first playable, single-screen browser slice of the Clock-Out two-player idea. The Teacher marks a route with chalk; the Chef redirects a runaway catering cart into a safe bay before it reaches a booth.

## Run locally

Open `index.html` in a modern browser. The prototype uses only HTML, CSS, Canvas 2D, and browser keyboard events; it has no build step or external dependencies.

## Controls

- Teacher: `W` / `A` / `S` / `D` to move, `F` to mark a path near the cart.
- Chef: arrow keys to move, `/` to redirect the cart during the visible path cue.
- Both players can move at once. Controls are a starting map and may be changed for a specific keyboard.

## Slice behavior

- The cart advances one of three track steps every eight seconds.
- The Teacher's chalk route visibly guides to the safe bay and pauses the cart for 1.5 seconds.
- The Chef's sweep succeeds only while the route cue is active and the Chef is close to the cart. Sweeping without a cue explains that the Teacher must mark the path first.
- Reaching the booth is a loss. Redirecting the cart completes a short roll into the bay and wins the round.
- Play again resets the players, cart, cue, timer, and outcome.

Keyboard rollover varies by hardware. Check simultaneous movement/action on the actual target keyboard and note its model/layout and browser when reporting input issues.