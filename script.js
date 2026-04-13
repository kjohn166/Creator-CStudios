document.getElementById("playBtn").addEventListener("click", () => {
    alert("Team page coming soon!");
});

// --- DevLog Panel Loader ---
// Reads MarkDownDocs/indexMD/DevLogPanel.md and renders the dev log box.
// Edit that file to update the panel — no HTML changes needed.
fetch('MarkDownDocs/indexMD/DevLogPanel.md')
    .then(res => res.text())
    .then(md => {
        const lines = md.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let label = '';
        let title = '';
        let body  = '';
        let image = '';
        let link  = 'blogs.html';

        for (const line of lines) {
            if (line.startsWith('# '))          label = line.slice(2).trim();
            else if (line.startsWith('## '))     title = line.slice(3).trim();
            else if (line.startsWith('image:'))  image = line.slice(6).trim();
            else if (line.startsWith('link:'))   link  = line.slice(5).trim();
            else if (!line.startsWith('#'))      body  = body ? body + ' ' + line : line;
        }

        const container = document.getElementById('devlog-content');
        if (!container) return;

        container.innerHTML = `
            <div class="devlog-inner">
                ${image ? `<div class="devlog-img-wrap">
                    <img src="${image}" alt="Dev log thumbnail" class="devlog-img">
                </div>` : ''}
                <div class="devlog-text">
                    ${label ? `<span class="devlog-label">${label}</span>` : ''}
                    ${title ? `<h2 class="devlog-title">${title}</h2>` : ''}
                    ${body  ? `<p class="devlog-body">${body}</p>` : ''}
                    <a href="${link}" class="devlog-btn">Read More &rarr;</a>
                </div>
            </div>
        `;
    })
    .catch(() => {
        const container = document.getElementById('devlog-content');
        if (container) container.innerHTML = '<p style="opacity:0.5;">Dev log unavailable.</p>';
    });
