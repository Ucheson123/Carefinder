export default function TestError() {
  // This explicitly throws a render error to trigger the ErrorBoundary
  throw new Error("Instructor Test Error: this is just for Error Boundary test");
  
  return null;
}