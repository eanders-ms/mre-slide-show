# mre-slide-show

This is a proof-of-concept to test the idea that we can render a prepared slideshow (published to slides.com) from an MRE app in AltspaceVR using server-side rendering.

## How it works

- When an app session starts up, a Chromium browser is spawned in headless mode and the slide deck page loaded.
- An in-world plane primitive is created, and serves as the slide projection surface.
- When the plane primitive is clicked by the user, the app advances to the next slide.
- Advancing to the next slide is achieved by querying the dom for the "next slide" div element and calling
its click() function.
- Screenshots of the page are produced at 30 FPS and assigned to the plane primitive's texture material.

## Areas for improvement

- Click handling could be generalized if we could get the normalized click coordinates. This would allow us to synthesize a browser-native click event on the page at that coordinate. **This would allow generalized web browsing**. As opposed to being bound to a specific site (slides.com in this case).
- Rather than a sucession of image textures, produce a video stream. Render as a streaming video texture on the client. This would allow for smooth animation and streaming video (remote YouTube player).

## Things to note

This is a proof of concept. It currently hemorrhages resources both on the server and on the client:
- Server side: Registers a new static buffer 30 times per second that is never freed. Can be remedied by more sophisticated buffer management.
- Client side: Allocates new texture resources at about the same rate. At this time the MRE SDK doesn't support resource unloading, so these textures accumulate in Unity.
