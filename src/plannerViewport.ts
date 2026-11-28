export function lockPlannerZoom() {
  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')!;
  const previous = viewport.content;
  viewport.content = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no';
  document.documentElement.classList.add('planner-viewport');

  const controller = new AbortController();
  const options = { passive: false, signal: controller.signal };
  const preventGesture = (event: Event) => event.preventDefault();
  // Safari also delivers native pinch gestures independently of the viewport hint.
  document.addEventListener('gesturestart', preventGesture, options);
  document.addEventListener('gesturechange', preventGesture, options);
  document.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  }, options);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && ['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
    }
  }, options);

  return () => {
    controller.abort();
    document.documentElement.classList.remove('planner-viewport');
    viewport.content = previous;
  };
}
