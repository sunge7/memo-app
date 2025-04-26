// DOM 요소 선택
const memoTitle = document.getElementById('memo-title');
const memoContent = document.getElementById('memo-content');
const memoImportant = document.getElementById('memo-important');
const saveBtn = document.getElementById('save-btn');
const memosContainer = document.getElementById('memos');

// 로컬 스토리지에서 메모 불러오기
let memos = JSON.parse(localStorage.getItem('memos')) || [];

// 메모 저장 함수
function saveMemo() {
    const title = memoTitle.value.trim();
    const content = memoContent.value.trim();
    const isImportant = memoImportant.checked;

    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요!');
        return;
    }

    const memo = {
        id: Date.now(),
        title,
        content,
        isImportant,
        date: new Date().toLocaleString()
    };

    memos.push(memo);
    localStorage.setItem('memos', JSON.stringify(memos));
    
    // 입력 필드 초기화
    memoTitle.value = '';
    memoContent.value = '';
    memoImportant.checked = false;
    
    // 메모 목록 업데이트
    displayMemos();
}

// 메모 삭제 함수
function deleteMemo(id) {
    memos = memos.filter(memo => memo.id !== id);
    localStorage.setItem('memos', JSON.stringify(memos));
    displayMemos();
}

// 메모 화면에 표시 함수
function displayMemos() {
    memosContainer.innerHTML = '';
    
    memos.slice().reverse().forEach(memo => {
        const memoElement = document.createElement('div');
        memoElement.className = 'memo';
        memoElement.innerHTML = `
            <div class="memo-header">
                <div class="memo-title">
                    <h3>${memo.title}</h3>
                    ${memo.isImportant ? '<i class="fas fa-star star-icon"></i>' : ''}
                </div>
                <button class="delete-btn" onclick="deleteMemo(${memo.id})">삭제</button>
            </div>
            <div class="memo-date">${memo.date}</div>
            <p>${memo.content}</p>
        `;
        memosContainer.appendChild(memoElement);
    });
}

// 이벤트 리스너
saveBtn.addEventListener('click', saveMemo);

// Enter 키로 저장
memoContent.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        saveMemo();
    }
});

// 초기 메모 목록 표시
displayMemos(); 