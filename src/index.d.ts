interface Preference {
  key: string;
  value: string;
}

declare class LittleFSWASMPreferences {
  namespace: string;
  fnProgress: ((message: string) => void) | null;
  preferences: Preference[];

  constructor(
    namespace: string,
    fnProgress?: (message: string) => void,
  );

  progressWrite: (message: string) => void;
  progressWriteLine: (message: string) => void;
  putString: (key: string, value: string) => void;
  putInt: (key: string, value: number) => void;
  getLittleFSImage: () => Promise<Uint8Array>;
}

export default LittleFSWASMPreferences;
