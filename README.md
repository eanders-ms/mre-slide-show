# mre-slide-show

This is a proof-of-concept to test the idea that we can render a prepared slideshow published to slides.com via MRE app in AltspaceVR using server-side rendering.

NOTE: This app currently hemorrhages resources both on the server and on the client:
- Server side: Registers a new static buffer 30 times per second that is never freed. Can be remedied by more sophisticated buffer management.
- Client side: Allocates new texture resources at about the same rate. At this time the MRE SDK doesn't support resource unloading, so these textures accumulate in Unity.
