// ============================================
// STARS — Submit Achievement JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  const zone      = document.getElementById('uploadZone');
  const fileInput = document.getElementById('proofFile');
  const preview   = document.getElementById('uploadPreview');

  const CATEGORY_NOTES = {
    '1': '📌 Upload your certificate, photo, or proof of your contest/competition placement.',
    '2': '📌 Upload your event certificate, photo, or participation proof.',
    '3': '📌 Upload the Lost & Found certificate given to you, then enter your PIN below.'
  };

  document.getElementById('achCategory').addEventListener('change', function () {
    const pinGroup  = document.getElementById('pinGroup');
    const pinInput  = document.getElementById('achPin');
    const noteEl    = document.getElementById('categoryNote');

    noteEl.textContent = CATEGORY_NOTES[this.value] || '';

    if (this.value === '3') {
      pinGroup.style.display = 'block';
      pinInput.required = true;
    } else {
      pinGroup.style.display = 'none';
      pinInput.required = false;
      pinInput.value = '';
    }
  });

  // ---- FILE UPLOAD ----
  zone.addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      document.getElementById('submitError').textContent = 'File too large. Max 5MB.';
      return;
    }
    fileInput._selectedFile = file;
    preview.textContent = `✓ Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    document.getElementById('submitError').textContent = '';
  }

  // ---- FORM SUBMIT ----
  const form = document.getElementById('submitForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn       = document.getElementById('submitBtn');
    const errEl     = document.getElementById('submitError');
    const successEl = document.getElementById('submitSuccess');

    errEl.textContent     = '';
    successEl.textContent = '';

    const categoryId   = document.getElementById('achCategory').value;
    const categoryText = document.getElementById('achCategory').selectedOptions[0]?.text || '—';
    const pin          = document.getElementById('achPin').value.trim().toUpperCase();
    const title        = document.getElementById('achTitle').value.trim();
    const desc         = document.getElementById('achDesc').value.trim();

    // ---- GET STUDENT ID ----
    const user = JSON.parse(localStorage.getItem('stars_user') || '{}');
    const studentId = user.student_id || '';
    if (!studentId) {
      errEl.textContent = 'Session expired. Please login again.';
      return;
    }

    // ---- PROOF REQUIRED ----
    if (!fileInput._selectedFile) {
      errEl.textContent = '📎 Please upload proof for your achievement.';
      return;
    }

    // ---- PIN VALIDATION for Lost & Found ----
    if (categoryId === '3') {
      if (!pin) {
        errEl.textContent = 'Please enter your Lost & Found PIN code.';
        return;
      }
      try {
        const pinCheck = await fetch(`http://localhost:8081/api/submissions/verify-pin?pin=${pin}`);
        const pinData  = await pinCheck.json();
        if (!pinData.valid) {
          errEl.textContent = '❌ ' + pinData.message;
          return;
        }
      } catch {
        errEl.textContent = 'Could not verify PIN. Make sure the backend is running.';
        return;
      }
    }

    // ---- CONFIRMATION DIALOG bago mag-submit ----
    const confirmed = await showConfirmDialog({
      title:    title,
      category: categoryText,
      desc:     desc || '(walang description)',
      file:     fileInput._selectedFile?.name || '—',
      pin:      categoryId === '3' ? pin : null
    });
    if (!confirmed) return;

    btn.disabled    = true;
    btn.textContent = 'Submitting...';

    // ---- BUILD FORM DATA ----
    const formData = new FormData();
    formData.append('studentId',        studentId);
    formData.append('title',            title);
    formData.append('category_id',      categoryId);
    formData.append('description',      desc);
    formData.append('points_requested', 0);
    formData.append('proof',            fileInput._selectedFile);

    if (categoryId === '3' && pin) {
      formData.append('pin_code', pin);
    }

    try {
      const data = await api.submitAchievement(formData);
      if (data.success) {
        successEl.textContent = '✓ Submitted! Waiting for admin review.';
        form.reset();
        preview.textContent = '';
        fileInput._selectedFile = null;
        document.getElementById('pinGroup').style.display   = 'none';
        document.getElementById('categoryNote').textContent = '';
      } else {
        errEl.textContent = data.message || 'Submission failed.';
      }
    } catch {
      errEl.textContent = 'Connection error. Please try again.';
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Submit for Review →';
    }
  });

  // ============================================
  // CONFIRMATION DIALOG FUNCTION
  // ============================================
  function showConfirmDialog({ title, category, desc, file, pin }) {
    return new Promise((resolve) => {
      document.getElementById('starsConfirmOverlay')?.remove();

      const isDark = document.body.classList.contains('dark-mode');

      const overlay = document.createElement('div');
      overlay.id = 'starsConfirmOverlay';
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.55);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;backdrop-filter:blur(4px);
        padding:16px;
      `;

      const card = document.createElement('div');
      card.style.cssText = `
        background:${isDark ? '#0f1758' : '#fff'};
        color:${isDark ? '#fff' : '#12142a'};
        border-radius:16px;padding:28px 24px;
        width:100%;max-width:440px;
        box-shadow:0 20px 60px rgba(0,0,0,0.3);
        border:1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
        max-height:90vh;overflow-y:auto;
      `;

      function row(label, value) {
        return `
          <div style="display:flex;gap:8px;padding:8px 0;
            border-bottom:1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#eee'};">
            <span style="font-size:12px;color:${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
              min-width:110px;flex-shrink:0;padding-top:1px;">${label}</span>
            <span style="font-size:13px;font-weight:500;word-break:break-word;
              line-height:1.4;">${value}</span>
          </div>`;
      }

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
          <span style="font-size:22px;">📋</span>
          <h3 style="margin:0;font-size:17px;font-weight:700;">
            Double-Check Your Submission
          </h3>
        </div>
        <p style="margin:0 0 16px;font-size:13px;
          color:${isDark ? 'rgba(255,255,255,0.45)' : '#999'};">
          Please review the details below before submitting.
        </p>

        <div style="
          background:${isDark ? 'rgba(255,255,255,0.04)' : '#f8f9fc'};
          border-radius:10px;padding:4px 14px;
          border:1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e8eaf0'};
          margin-bottom:16px;
        ">
          ${row('📌 Title',       title)}
          ${row('🗂️ Category',    category.replace(/^[🏅🤝🔍]\s*/, ''))}
          ${row('📝 Description', desc)}
          ${row('📎 Proof File',  file)}
          ${pin ? row('🔑 PIN Code', pin) : ''}
        </div>

        <div style="
          background:rgba(238,120,28,0.08);
          border:1px solid rgba(238,120,28,0.22);
          border-radius:8px;padding:10px 14px;
          font-size:12px;
          color:${isDark ? 'rgba(255,255,255,0.55)' : '#888'};
          margin-bottom:20px;line-height:1.6;
        ">
          ⚠️ <strong style="color:${isDark ? 'rgba(255,255,255,0.8)' : '#555'};">
            Reminder:</strong>
          Make sure your proof is clear and valid.
          Fake or edited submissions will be <strong>rejected</strong> and
          may result in penalties.
        </div>

        <div style="display:flex;gap:10px;">
          <button id="confirmNo" style="
            flex:1;padding:11px;border-radius:10px;
            border:1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#ddd'};
            background:transparent;
            color:${isDark ? 'rgba(255,255,255,0.7)' : '#555'};
            font-size:14px;font-weight:600;cursor:pointer;
            transition:background 0.2s;
          ">← Go Back</button>
          <button id="confirmYes" style="
            flex:1;padding:11px;border-radius:10px;border:none;
            background:linear-gradient(135deg,#ee781c,#f25522);
            color:#fff;font-size:14px;font-weight:700;cursor:pointer;
            box-shadow:0 4px 14px rgba(238,120,28,0.35);
            transition:opacity 0.2s;
          ">✓ Submit Now</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // Hover effects
      const noBtn  = card.querySelector('#confirmNo');
      const yesBtn = card.querySelector('#confirmYes');
      noBtn.addEventListener('mouseenter',  () => noBtn.style.background  = isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5');
      noBtn.addEventListener('mouseleave',  () => noBtn.style.background  = 'transparent');
      yesBtn.addEventListener('mouseenter', () => yesBtn.style.opacity = '0.88');
      yesBtn.addEventListener('mouseleave', () => yesBtn.style.opacity = '1');

      yesBtn.addEventListener('click', () => { overlay.remove(); resolve(true); });
      noBtn.addEventListener('click',  () => { overlay.remove(); resolve(false); });
      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) { overlay.remove(); resolve(false); }
      });
    });
  }

});
