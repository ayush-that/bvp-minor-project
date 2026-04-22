import { $typst } from "@myriaddreamin/typst.ts/contrib/snippet";

// init flag
let isInitialized = false;
let isInitializing = false;
let initializationError: Error | null = null;

/**
 * init typst compiler (wasm module)
 * lazy loading - only when needed
 */
export async function initializeTypstCompiler(): Promise<void> {
  // already init
  if (isInitialized) return;

  // already initializing
  if (isInitializing) {
    // wait for current init
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (isInitialized) return;
    if (initializationError) throw initializationError;
  }

  try {
    isInitializing = true;
    initializationError = null;

    console.log("Initializing Typst compiler...");
    
    // cfg compiler to use cdn wasm (avoids vite bundling issues)
    $typst.setCompilerInitOptions({
      getModule: () =>
        'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm',
    });

    isInitialized = true;
    console.log("Typst compiler ready");
  } catch (error) {
    console.error("Compiler init error:", error);
    initializationError =
      error instanceof Error ? error : new Error("Failed to init compiler");
    throw initializationError;
  } finally {
    isInitializing = false;
  }
}

/**
 * compile typst src to pdf
 * @param sourceCode - typst markup string
 * @returns pdf blob
 */
export async function compileTypstToPdf(
  sourceCode: string
): Promise<{ blob: Blob; url: string }> {
  // ensure compiler is init
  await initializeTypstCompiler();

  try {
    console.log("==== COMPILING TYPST TO PDF ====");
    console.log("Source code length:", sourceCode.length, "chars");
    console.log("First 200 chars:", sourceCode.substring(0, 200));

    // compile to pdf using $typst api
    const pdfBytes = await $typst.pdf({
      mainContent: sourceCode,
    });

    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error("Compilation produced no output");
    }

    // conv to blob - create new uint8array to ensure proper type
    const pdfArray = new Uint8Array(pdfBytes);
    const blob = new Blob([pdfArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    console.log("✅ PDF generated successfully");
    return { blob, url };
  } catch (error) {
    console.error("❌ TYPST COMPILATION ERROR:", error);
    
    // log detailed error info
    if (error && typeof error === "object") {
      console.error("Error type:", error.constructor.name);
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
    
    // extract useful error msg from diagnostic if available
    let errorMessage = "Failed to compile Typst";
    if (error && typeof error === "object" && "toString" in error) {
      const errorStr = String(error);
      console.error("Error string:", errorStr);
      
      // try to extract variable name from error
      const varMatch = errorStr.match(/unknown variable:\s*(\w+)/);
      if (varMatch) {
        errorMessage = `Typst error: undefined variable '${varMatch[1]}'. The AI generated code references a variable that doesn't exist. Please try regenerating with a different template.`;
      } else if (errorStr.includes("unknown variable")) {
        errorMessage = "Typst error: The generated code references undefined variables. Please try regenerating or use a different template.";
      } else if (errorStr.includes("failed to load file")) {
        errorMessage = "Typst error: Template uses unsupported file imports. Please use a different template.";
      }
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * check if compiler is rdy
 */
export function isCompilerReady(): boolean {
  return isInitialized;
}

/**
 * cleanup obj url to prevent mem leaks
 */
export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}


