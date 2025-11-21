window.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOM fully loaded and parsed');
  
  let body = document.querySelector('body');

  let h3 = document.createElement('h3');
  h3.innerText = 'Print CofS';
  body.appendChild(h3);

  let button = document.createElement('button');
  button.innerText = 'Create Report';
  body.append(button);

  button.addEventListener('click', downloadFileWithPost);

  async function downloadFileWithPost() {
    const postData = {
      reportType: 'cofs',
      teamid: '64dad6b14952737d1eb2193f',
      siteid: 'dgsc',
      companyid: 'rtx',
      startDate: '10/7/2025',
      endDate: '10/13/2025',
      userid: '63a39b8255247905bd993e1f',
      includeDaily: true
    };

    try {
      const response = await fetch('http://localhost:7005/api/general/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error!: status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.startsWith('attachment; filename=')) {
        a.download = disposition.substring(21);
      } else {
        a.download = 'cofs.zip';
      }
      console.log(a.download);

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Problem while downloading the file: ', error);
      alert('There was a problem downloading the file.');
    }
  }
});