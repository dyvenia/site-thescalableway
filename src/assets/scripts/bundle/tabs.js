document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('[data-tab-target]');
  const panels = document.querySelectorAll('[data-tab-panel]');

  panels.forEach((panel, index) => {
    panel.hidden = index !== 0;
  });

  tabs.forEach((tab, index) => {
    tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

    tab.addEventListener('click', () => {
      const targetPanelId = tab.dataset.tabTarget;

      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      panels.forEach(panel => (panel.hidden = true));

      tab.setAttribute('aria-selected', 'true');
      const targetPanel = document.querySelector(`[data-tab-panel="${targetPanelId}"]`);
      if (targetPanel) {
        targetPanel.hidden = false;
      }
    });
  });
});
