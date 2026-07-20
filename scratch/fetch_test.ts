const url = "http://localhost:3000/projects/cmri5atwh0000vcos810qc8ij";
fetch(url)
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => {
    if (text.includes("404")) {
      console.log("Includes 404!");
    } else {
      console.log("Success! Length:", text.length);
    }
  })
  .catch(err => console.error(err));
