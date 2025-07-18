// index.js
// This script dynamically creates a functional index page

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.background = '#f4f4f4';
document.body.style.fontFamily = 'Arial, sans-serif';

const container = document.createElement('div');
container.style.maxWidth = '600px';
container.style.margin = '60px auto';
container.style.background = '#fff';
container.style.padding = '32px';
container.style.borderRadius = '8px';
container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

const h1 = document.createElement('h1');
h1.textContent = 'Welcome to the Index Page';
h1.style.color = '#333';

const p = document.createElement('p');
p.textContent = 'This is your functional index page. Customize it as needed!';
p.style.color = '#555';

const btn = document.createElement('a');
btn.textContent = 'Click Me';
btn.href = '#';
btn.className = 'btn';
btn.style.display = 'inline-block';
btn.style.padding = '10px 20px';
btn.style.background = '#007bff';
btn.style.color = '#fff';
btn.style.border = 'none';
btn.style.borderRadius = '4px';
btn.style.textDecoration = 'none';
btn.style.transition = 'background 0.2s';
btn.onmouseover = () => btn.style.background = '#0056b3';
btn.onmouseout = () => btn.style.background = '#007bff';
btn.onclick = (e) => { e.preventDefault(); alert('Button clicked!'); };

container.appendChild(h1);
container.appendChild(p);
container.appendChild(btn);
document.body.appendChild(container);
