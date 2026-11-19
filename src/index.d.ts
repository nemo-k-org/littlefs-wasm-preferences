import { Buffer } from 'buffer'

export type PreferenceType = 'string' | 'int'

export interface Preference {
  key: string;
  value: string|Buffer;
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
  put: (key: string, value: number|string, type: PreferenceType) => void;
  getLittleFSImage: () => Promise<Uint8Array>;
}

export default LittleFSWASMPreferences;
