import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// ---------------------------------------------------------------------------
// Jasmine compatibility shim
// Lets existing specs using jasmine.createSpyObj / jasmine.createSpy /
// spy.and.returnValue() keep working without changes.
// ---------------------------------------------------------------------------
const makeAndChain = (fn: jest.Mock) => {
  (fn as any).and = {
    returnValue:  (val: unknown)                      => fn.mockReturnValue(val),
    returnValues: (...vals: unknown[])                => { vals.forEach(v => fn.mockReturnValueOnce(v)); return fn; },
    callFake:     (impl: (...a: unknown[]) => unknown) => fn.mockImplementation(impl),
    throwError:   (msg: string)                       => fn.mockImplementation(() => { throw new Error(msg); }),
    stub:         ()                                  => fn.mockImplementation(() => undefined),
  };
  return fn;
};

(globalThis as any).jasmine = {
  ...((globalThis as any).jasmine ?? {}),
  createSpy: (_name: string) =>
    makeAndChain(jest.fn()),

  createSpyObj: <T>(_baseName: string, methods: (keyof T | string)[]) => {
    const obj: Record<string, jest.Mock> = {};
    for (const m of methods) {
      obj[m as string] = makeAndChain(jest.fn());
    }
    return obj as unknown as T;
  },
};
