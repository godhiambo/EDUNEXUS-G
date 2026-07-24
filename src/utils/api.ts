/**
 * Safely parses response JSON from API endpoints, avoiding client crashes
 * when the server returns non-JSON or HTML content.
 */
export async function handleResponseJson(
  response: Response,
  defaultError = 'An error occurred during the request.'
): Promise<any> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      try {
        const errData = await response.json();
        throw new Error(errData.error || defaultError);
      } catch (parseErr: any) {
        if (parseErr instanceof Error && parseErr.message !== defaultError) {
          throw parseErr;
        }
      }
    }

    try {
      const rawText = await response.text();
      if (rawText && rawText.length < 250 && !rawText.trim().startsWith('<')) {
        throw new Error(rawText.trim());
      }
    } catch (textErr) {
      // ignore
    }

    throw new Error(defaultError);
  }

  if (isJson) {
    try {
      return await response.json();
    } catch (jsonErr) {
      throw new Error('Received invalid JSON response from the server. Please try again.');
    }
  }

  // If status is OK but content is not JSON (e.g., Vite dev-server fallback HTML)
  throw new Error('Received an invalid non-JSON response from the server. Please try again.');
}
