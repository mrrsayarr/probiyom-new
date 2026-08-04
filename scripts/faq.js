/* ===================================================================
   FaqList – renders an accordion of question/answer items (Butter-Smooth Edition)
   =================================================================== */

function FaqList(container, items) {
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-state">Henüz soru eklenmedi.</div>';
    return;
  }

  var html = '<ul class="faq-list list-unstyled m-0 d-flex flex-column gap-3">';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    html +=
      '<li class="faq-item border border-light-subtle rounded-3 overflow-hidden bg-white shadow-sm transition-all">' +
        '<button type="button" class="faq-question w-100 d-flex align-items-center justify-content-between gap-3 px-4 py-3 border-0 bg-transparent" aria-expanded="false" data-index="' + i + '">' +
          '<span class="fw-bold text-brand">' + escapeHtml(item.question) + '</span>' +
          '<span class="faq-arrow-container d-flex align-items-center justify-content-center rounded-circle transition-all">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="faq-arrow transition-all"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
          '</span>' +
        '</button>' +
        '<div class="faq-answer overflow-hidden transition-all" role="region" style="max-height: 0;">' +
          '<div class="faq-answer-inner px-4 pb-4 pt-0 border-top border-light-subtle pt-3">' +
            '<p class="text-muted small lh-relaxed mb-0">' + formatText(item.answer) + '</p>' +
          '</div>' +
        '</div>' +
      '</li>';
  }
  html += '</ul>';

  container.innerHTML = html;

  var buttons = container.querySelectorAll('.faq-question');
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].addEventListener('click', function () {
      var item = this.parentNode;
      var answer = item.querySelector('.faq-answer');
      var isOpen = item.classList.toggle('is-open');
      
      this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      
      // YENİ: scrollHeight yardımıyla piksel bazlı milimetrik akışkan animasyon
      if (isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0px';
      }
    });
  }
}