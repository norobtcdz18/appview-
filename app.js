
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
    import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

    // إعدادات Firebase الخاصة بك
    const firebaseConfig = {
      apiKey: "AIzaSyCqqQIey88U8Aqz3Jb_-sXIudzrEzPZPnI",
      authDomain: "masarifi-4e451.firebaseapp.com",
      projectId: "masarifi-4e451",
      storageBucket: "masarifi-4e451.firebasestorage.app",
      messagingSenderId: "792484875097",
      appId: "1:792484875097:web:5df01e88e4b5af51121a48"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let projects = {};
    let currentId = null;
    let autoSaveTimer = null;

    // --- نظام تعقب حالة الإنترنت ---
    window.checkNetworkStatus = (showMessage = true) => {
      const cloudIcon = document.getElementById('cloudIcon');
      if (navigator.onLine) {
        cloudIcon.className = 'ri-cloud-fill'; // سحابة عادية
        cloudIcon.style.color = 'var(--success)'; // أخضر
        if(showMessage) window.showToast('متصل بالإنترنت', 'var(--success)', 'ri-wifi-line');
      } else {
        cloudIcon.className = 'ri-cloud-off-fill'; // سحابة مقطوعة
        cloudIcon.style.color = 'var(--danger)'; // أحمر
        if(showMessage) window.showToast('لا يوجد اتصال بالإنترنت', 'var(--danger)', 'ri-wifi-off-line');
      }
    };

    // الاستماع لتغيرات الشبكة
    window.addEventListener('online', () => window.checkNetworkStatus(true));
    window.addEventListener('offline', () => window.checkNetworkStatus(true));
    
    // فحص الحالة عند فتح الصفحة (بدون إشعار مزعج)
    window.checkNetworkStatus(false);
    // -----------------------------

    // دوال مساعدة
    window.escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    
    window.showToast = (msg, bgColor = 'var(--success)', icon = 'ri-check-line') => {
      const existing = document.querySelector('.toast');
      if(existing) existing.remove();
      const t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = `<i class="${icon}"></i> ${msg}`;
      t.style.background = bgColor;
      document.body.appendChild(t);
      void t.offsetWidth;
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
      }, 2500);
    };

    // جلب البيانات من فايربيز
    window.fetchProjectsData = async () => {
      if (!navigator.onLine) {
        window.showToast('يرجى التحقق من الاتصال بالإنترنت', 'var(--danger)', 'ri-wifi-off-line');
        return;
      }
      
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        projects = {};
        querySnapshot.forEach((doc) => {
          projects[doc.id] = doc.data();
        });
        window.renderList();
      } catch (error) {
        console.error("Error fetching projects: ", error);
        window.showToast('خطأ في الاتصال بقاعدة البيانات', 'var(--danger)', 'ri-error-warning-line');
      }
    };

    window.renderList = () => {
      const list = document.getElementById('projectsList');
      const ids = Object.keys(projects).sort((a,b) => (projects[b].created || 0) - (projects[a].created || 0));
      
      if (ids.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <i class="ri-folder-open-line"></i>
            <p>لا توجد مشاريع سحابية بعد.<br>اضغط على + للبدء!</p>
          </div>
        `;
        list.style.display = 'block';
        return;
      }

      list.style.display = 'grid';
      list.innerHTML = ids.map(id => `
        <div class="project-card" onclick="loadProject('${id}')">
          <div class="project-info">
            <span class="project-title">${window.escapeHtml(projects[id].name)}</span>
            <span class="project-date">سحابي ☁️</span>
          </div>
          <button class="delete-btn" onclick="event.stopPropagation(); deleteProject('${id}')">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      `).join('');
    };

    window.navigateTo = (screenId) => {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(screenId).classList.add('active');
    };

    window.loadProject = (id) => {
      currentId = id;
      const p = projects[id];
      document.getElementById('projectName').value = p.name;
      document.getElementById('codeEditor').value = p.code;
      window.navigateTo('editorScreen');
      if(document.querySelector('.tab-btn.active').innerText.includes('المعاينة')) {
        window.updatePreview();
      }
    };

    window.closeProject = () => {
      currentId = null;
      document.getElementById('codeEditor').value = '';
      window.renderList();
      window.navigateTo('homeScreen');
    };

    window.newProject = () => {
      if (!navigator.onLine) {
        window.showToast('لا يمكن إنشاء مشروع بدون إنترنت', 'var(--danger)', 'ri-wifi-off-line');
        return;
      }

      window.showModal('مشروع سحابي جديد', 'أدخل اسم المشروع', async (name) => {
        if (!name.trim()) return;
        const id = 'p_' + Date.now();
        const newProj = {
          name: name,
          code: '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>' + name + '</title>\n  <style>\n    body { font-family: system-ui, sans-serif; padding: 20px; }\n  </style>\n</head>\n<body>\n  <h1>مرحباً بك! 🚀</h1>\n</body>\n</html>',
          created: Date.now()
        };
        
        projects[id] = newProj;
        window.loadProject(id);
        
        try {
          await setDoc(doc(db, "projects", id), newProj);
          window.showToast('تم الإنشاء في السحابة', 'var(--success)', 'ri-cloud-fill');
        } catch (e) {
          window.showToast('حدث خطأ أثناء الحفظ', 'var(--danger)');
        }
      });
    };

    window.deleteProject = async (id) => {
      if (!navigator.onLine) {
        window.showToast('مطلوب إنترنت لحذف المشروع', 'var(--danger)', 'ri-wifi-off-line');
        return;
      }

      if (!confirm('هل أنت متأكد من الحذف نهائياً من السحابة؟')) return;
      delete projects[id];
      window.renderList();
      try {
        await deleteDoc(doc(db, "projects", id));
        window.showToast('تم الحذف سحابياً', 'var(--danger)', 'ri-delete-bin-line');
      } catch(e) {
        window.showToast('فشل الحذف', 'var(--danger)');
      }
    };

    window.saveCurrent = async () => {
      if (!currentId) return;
      if (!navigator.onLine) {
        window.showToast('حفظ مؤقت (لا يوجد إنترنت)', 'var(--danger)', 'ri-wifi-off-line');
        return;
      }

      projects[currentId].name = document.getElementById('projectName').value || 'بدون اسم';
      projects[currentId].code = document.getElementById('codeEditor').value;
      
      try {
        await setDoc(doc(db, "projects", currentId), projects[currentId]);
        window.showToast('تم الحفظ في السحابة', 'var(--success)', 'ri-cloud-check-fill');
      } catch(e) {
        window.showToast('مشكلة في الاتصال', 'var(--danger)');
      }
    };

    // حفظ تلقائي
    window.autoSave = () => {
      if (!currentId) return;
      clearTimeout(autoSaveTimer);
      projects[currentId].code = document.getElementById('codeEditor').value; 
      
      autoSaveTimer = setTimeout(async () => {
        if(navigator.onLine) {
          try {
            await setDoc(doc(db, "projects", currentId), projects[currentId]);
          } catch(e) {
            console.error("Auto-save failed");
          }
        }
      }, 3000); 
    };

    window.updateName = () => {
      if (!currentId) return;
      projects[currentId].name = document.getElementById('projectName').value;
      window.autoSave();
    };

    window.switchTab = (tab, el) => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('viewEditor').classList.toggle('active', tab === 'editor');
      document.getElementById('viewPreview').classList.toggle('active', tab === 'preview');
      if (tab === 'preview') window.updatePreview();
    };

    window.updatePreview = () => {
      const code = document.getElementById('codeEditor').value;
      const frame = document.getElementById('previewFrame');
      frame.srcdoc = code;
    };

    window.toggleFullscreen = () => {
      const frame = document.getElementById('previewFrame');
      if (!document.fullscreenElement) {
        if (frame.requestFullscreen) {
          frame.requestFullscreen();
        } else if (frame.webkitRequestFullscreen) { 
          frame.webkitRequestFullscreen();
        } else if (frame.msRequestFullscreen) { 
          frame.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    window.showModal = (title, placeholder, callback) => {
      document.getElementById('modalTitle').textContent = title;
      const input = document.getElementById('modalInput');
      input.value = '';
      input.placeholder = placeholder;
      document.getElementById('modal').classList.add('show');
      setTimeout(() => input.focus(), 300);
      const btn = document.getElementById('modalConfirm');
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.onclick = () => { callback(input.value); window.closeModal(); };
      input.onkeydown = (e) => { if (e.key === 'Enter') { callback(input.value); window.closeModal(); } };
    };

    window.closeModal = () => { document.getElementById('modal').classList.remove('show'); };

    // تحميل البيانات عند فتح الصفحة
    if (navigator.onLine) {
      window.fetchProjectsData();
    }
  