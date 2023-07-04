/*module.exports = () => {
  // ...
};*/
const fs = require('fs');
const path = require('path');
const userPath = process.argv[2];


const absolutePath = () => {
  return new Promise((resolve, reject) => {
    const resolvedPath = path.resolve(userPath);
    resolve(resolvedPath); // Resolvemos la promesa con la ruta completa del archivo
  });
};

absolutePath()
  .then((resolvedPath) => {
    return new Promise((resolve, reject) => {
      fs.access(resolvedPath, (error) => {
        if (error) {
          reject("File does not exist"); // El archivo no existe
        } else {
          resolve(resolvedPath); // El archivo existe
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
          resolve({ resolvedPath, stats }); // Resolvemos la promesa con la ruta y las estadísticas del archivo
        }
      });
    });
  })
  .then(({ resolvedPath, stats }) => {
    if (stats.isFile()) {
      const extension = path.extname(resolvedPath);
      console.log(extension);
      if (extension !== ".md") {
        console.log('The file you are trying to read does not include a .md extension. Only .md extension files are supported.');
      } else {
        fs.readFile(resolvedPath, 'utf8', (err, data) => {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
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
            const directoryPath = process.argv[2];
            const filePath = path.join(directoryPath, file); // Obtener la ruta completa del archivo
            fs.readFile(filePath, 'utf8', (err, data) => {
              if (err) {
                console.log(err);
              } else {
                console.log(data);
              }
          })
        });
        }
      });
    }
  })
  .catch((error) => {
    console.log(error); // Manejo de errores, si es necesario
  });

