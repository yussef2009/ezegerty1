import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  if (content.includes('"/utils/supabase/info"')) {
    // Calculate relative path from file to ./supabase/info
    // file is like ./app/pages/client/Dashboard.tsx
    // dir is like ./app/pages/client
    const dir = path.dirname(file);
    let relativePath = path.relative(dir, './supabase/info').replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    newContent = newContent.replace(/"\/utils\/supabase\/info"/g, `"${relativePath}"`);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
});
