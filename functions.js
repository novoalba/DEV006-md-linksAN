const fs = require('fs');
const path = require('path');
const https = require('https');

function lookForLinks(content, filePath) {
  const regexForLinks = /\[([^\]]+)\]\((?!#)(https?:\/\/[^\)]+)\)/g;
  const links = [];
  let match;

  while ((match = regexForLinks.exec(content)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];
    links.push({ href: linkUrl, text: linkText, file: filePath });
  }

  return links;
}

function validateUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const { statusCode } = res;
      let message;

      if (statusCode >= 400) {
        message = 'fail';
      } else {
        message = 'ok';
      }

      resolve({ statusCode, message });
    }).on('error', (err) => {
      if (err.code === 'ENOTFOUND') {
        resolve({ statusCode: 404, message: 'fail' });
      }
    }).on('close', () => {
      resolve({ statusCode: 0, message: 'connection_issue' });
    });
  });
}

const userPath = process.argv[2];

const absolutePath = () => {
  return new Promise((resolve, reject) => {
    const resolvedPath = path.resolve(userPath);
    resolve(resolvedPath);
  });
};

absolutePath()
  .then((resolvedPath) => {
    return new Promise((resolve, reject) => {
      fs.access(resolvedPath, (error) => {
        if (error) {
          reject('File does not exist');
        } else {
          resolve(resolvedPath);
        }
      });
    });
  })
  .then((resolvedPath) => {
    return new Promise((resolve, reject) => {
      fs.stat(resolvedPath, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve({ resolvedPath, stats });
        }
      });
    });
  })
  .then(({ resolvedPath, stats }) => {
    if (stats.isFile()) {
      const extension = path.extname(resolvedPath);
      if (extension !== '.md') {
        console.log('The file you are trying to read does not include a .md extension. Only .md extension files are supported.');
      } else {
        fs.readFile(resolvedPath, 'utf8', (err, data) => {
          if (err) {
            console.log(err);
          } else {
            const links = lookForLinks(data, resolvedPath);
            links.forEach(link => {
              validateUrl(link.href)
                .then(result => {
                  console.log(`Link: ${link.href}`);
                  console.log(`Status Code: ${result.statusCode}`);
                  console.log(`Message: ${result.message}`);
                  console.log('----------------------');
                })
                .catch(error => {
                  console.log(`Error validating link: ${link.href}`);
                  console.log(error);
                  console.log('----------------------');
                });
            });
          }
        });
      }
    } else {
      console.log(`${resolvedPath} is not a file.`);
      fs.readdir(resolvedPath, (err, files) => {
        if (err) {
          console.error(err);
          return;
        }

        const markdownFiles = files.filter(file => path.extname(file) === '.md');

        if (markdownFiles.length === 0) {
          console.log('No Markdown files found in the directory.');
        } else {
          markdownFiles.forEach(file => {
            const filePath = path.join(resolvedPath, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
              if (err) {
                console.log(err);
              } else {
                const links = lookForLinks(data, filePath);
                links.forEach(link => {
                  validateUrl(link.href)
                    .then(result => {
                      console.log(`Link: ${link.href}`);
                      console.log(`Status Code: ${result.statusCode}`);
                      console.log(`Message: ${result.message}`);
                      console.log('----------------------');
                    })
                    .catch(error => {
                      console.log(`Error validating link: ${link.href}`);
                      console.log(error);
                      console.log('----------------------');
                    });
                });
              }
            });
          });
        }
      });
    }
  })
  .catch((error) => {
    console.log(error);
  });

