import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialise the PDF.js worker once at module load.
// Importing this module from anywhere in the app is sufficient.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl as string;

export { pdfjs };
