export function postMessage(application: string, message: string): void {
  const postData = {
    application: application,
    message: message
  };

  if (process.env.logurl) {
    fetch(process.env.logurl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
  }
}