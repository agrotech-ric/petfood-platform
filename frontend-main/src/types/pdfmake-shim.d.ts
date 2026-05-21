declare module 'pdfmake/build/pdfmake' {
  import type { TCreatedPdf } from 'pdfmake/interfaces';

  interface PdfMakeStatic {
    vfs: Record<string, string>;
    fonts: Record<
      string,
      { normal: string; bold: string; italics: string; bolditalics: string }
    >;
    addVirtualFileSystem?(vfs: Record<string, string>): void;
    createPdf(docDefinition: unknown): TCreatedPdf;
  }

  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  /** Font files map: filename -> base64 */
  const vfs: Record<string, string>;
  export default vfs;
}
