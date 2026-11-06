(() => {
  const form = document.getElementById('selfcheck-form');
  if (!form) return;
  const questions = [...form.querySelectorAll('fieldset[data-key]')];
  const progress = document.getElementById('selfcheck-progress-text');
  const bar = document.getElementById('selfcheck-meter-bar');
  const results = document.getElementById('selfcheck-results');
  const counts = document.getElementById('selfcheck-counts');
  const followups = document.getElementById('selfcheck-followups');
  const copyStatus = document.getElementById('selfcheck-copy-status');
  let lastReport = '';
  let fallbackArea = null;
  const read = () => questions.map(q => ({
    topic: q.dataset.topic,
    link: q.dataset.link,
    priority: Number(q.dataset.priority || 9),
    value: form.querySelector(`input[name="${q.dataset.key}"]:checked`)?.value || ''
  }));
  const update = () => {
    const answered = read().filter(item => item.value).length;
    progress.textContent = `已回答 ${answered} / ${questions.length} 项`;
    bar.style.width = `${answered / questions.length * 100}%`;
    results.hidden = true;
    if (copyStatus) copyStatus.textContent = '';
    if (fallbackArea) { fallbackArea.remove(); fallbackArea = null; }
  };
  form.addEventListener('change', update);
  form.addEventListener('reset', () => {
    requestAnimationFrame(update);
    results.hidden = true;
  });
  document.getElementById('selfcheck-results-button').addEventListener('click', () => {
    const answers = read();
    const yes = answers.filter(x => x.value === 'yes').length;
    const no = answers.filter(x => x.value === 'no').sort((a, b) => a.priority - b.priority);
    const unknown = answers.filter(x => x.value === 'unknown').sort((a, b) => a.priority - b.priority);
    const skipped = answers.filter(x => !x.value).sort((a, b) => a.priority - b.priority);
    counts.textContent = `已确认 ${yes} 项 · 需要处理 ${no.length} 项 · 不确定 ${unknown.length} 项 · 未回答 ${skipped.length} 项`;
    followups.replaceChildren();
    const lines = ['家庭网络安全自检待办', `已确认 ${yes} 项；需要处理 ${no.length} 项；不确定 ${unknown.length} 项 · 未回答 ${skipped.length} 项`, '', '需要处理：', ...no.map(x => `- ${x.topic}：${new URL(x.link, window.location.origin).href}`), '', '不确定：', ...unknown.map(x => `- ${x.topic}：${new URL(x.link, window.location.origin).href}`), '', '未回答：', ...skipped.map(x => `- ${x.topic}：${new URL(x.link, window.location.origin).href}`), '', '根据用户自行勾选整理，不代表漏洞扫描结果。'];
    lastReport = lines.join('\n');
    if (copyStatus) copyStatus.textContent = '';
    if (fallbackArea) { fallbackArea.remove(); fallbackArea = null; }
    const addGroup = (heading, items, intro) => {
      const section = document.createElement('section');
      const h = document.createElement('h3'); h.textContent = heading; section.append(h);
      const p = document.createElement('p'); p.textContent = intro; section.append(p);
      if (items.length) {
        const ul = document.createElement('ul');
        for (const item of items) {
          const li = document.createElement('li');
          const a = document.createElement('a'); a.href = item.link; a.textContent = item.topic + '：查看操作指南';
          li.append(a); ul.append(li);
        }
        section.append(ul);
      }
      followups.append(section);
    };
    addGroup('已确认需要处理', no, no.length ? '先处理账号控制、加密和远程访问等风险较高的项目；以下顺序是一般性参考，不代表已检测漏洞。' : '没有标记为需要处理的项目。');
    addGroup('不确定，需要核对', unknown, unknown.length ? '这些项目已经查看，但暂时无法确认，建议按链接继续核对。' : '没有标记为不确定的项目。');
    addGroup('尚未回答', skipped, skipped.length ? '这些问题还没有作答，可以返回上方检查后重新生成清单。' : '没有遗漏未回答的项目。');
    results.hidden = false;
    results.focus();
    if (copyStatus) copyStatus.textContent = "已生成清单，可以复制或打印。";
  });
  document.getElementById('selfcheck-copy').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(lastReport);
      copyStatus.textContent = '已复制待办清单。';
    } catch (_) {
      if (fallbackArea) fallbackArea.remove();
      fallbackArea = document.createElement('textarea');
      fallbackArea.className = 'selfcheck-fallback-text';
      fallbackArea.setAttribute('aria-label', '待办清单文本，请手动复制');
      fallbackArea.value = lastReport;
      fallbackArea.rows = 9;
      copyStatus.after(fallbackArea);
      fallbackArea.focus();
      fallbackArea.select();
      copyStatus.textContent = '浏览器无法自动复制，已选中下方文本，可手动复制。';
    }
  });
  document.getElementById('selfcheck-print').addEventListener('click', () => window.print());
  update();
})();
