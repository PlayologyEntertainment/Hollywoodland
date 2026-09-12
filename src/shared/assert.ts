export function assertElement<T extends Element>(selector: string, type: new () => T): T {
  const element = document.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`Expected ${selector} to match ${type.name}`);
  return element;
}
