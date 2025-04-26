// DOM 요소
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todosContainer = document.getElementById('todos');
const memoTitle = document.getElementById('memo-title');
const memoContent = document.getElementById('memo-content');
const memoImportant = document.getElementById('memo-important');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const memosContainer = document.getElementById('memos');
const logoutBtn = document.getElementById('logout-btn');

// 현재 편집 중인 메모 ID
let editingMemoId = null;

// Firebase 초기화
const auth = getAuth();
const provider = new GoogleAuthProvider();

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 로그인 상태
        loadTodos();
        loadMemos();
    } else {
        // 로그아웃 상태
        todosContainer.innerHTML = '';
        memosContainer.innerHTML = '';
    }
});

// 로그아웃 버튼 이벤트
logoutBtn.addEventListener('click', () => {
    signOut(auth)
        .catch((error) => {
            console.error('로그아웃 에러:', error);
        });
});

// 할 일 추가
function addTodo() {
    try {
        const text = todoInput.value.trim();
        if (!text) {
            alert('할 일을 입력해주세요!');
            return;
        }

        const user = auth.currentUser;
        if (user) {
            const todoRef = ref(database, `users/${user.uid}/todos`);
            push(todoRef, {
                text: text,
                completed: false,
                createdAt: new Date().toISOString(),
                author: user.displayName || '익명',
                authorId: user.uid,
                authorEmail: user.email
            });
            todoInput.value = '';
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 할 일 불러오기
function loadTodos() {
    try {
        todosContainer.innerHTML = '';
        
        const user = auth.currentUser;
        if (user) {
            const todoRef = ref(database, `users/${user.uid}/todos`);
            const queryRef = query(todoRef, orderByChild('createdAt'));
            
            onValue(queryRef, (snapshot) => {
                const todos = [];
                snapshot.forEach((childSnapshot) => {
                    const todo = childSnapshot.val();
                    todo.id = childSnapshot.key;
                    todos.push(todo);
                });
                
                todos.forEach((todo) => {
                    const todoElement = createTodoElement(todo.id, todo);
                    todosContainer.appendChild(todoElement);
                });
            }, (error) => {
                console.error("할 일 불러오기 중 오류 발생:", error);
                alert('할 일을 불러오는 중 오류가 발생했습니다.');
            });
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 할 일 요소 생성
function createTodoElement(id, todo) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    
    div.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo('${id}')">
        <span class="todo-text">${todo.text}</span>
        <div class="todo-info">
            <span class="todo-author">작성자: ${todo.author}</span>
            <span class="todo-date">${new Date(todo.createdAt).toLocaleString()}</span>
        </div>
        <div class="todo-actions">
            <button onclick="deleteTodo('${id}')" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

// 할 일 완료 상태 토글
function toggleTodo(id) {
    try {
        const user = auth.currentUser;
        if (user) {
            const todoRef = ref(database, `users/${user.uid}/todos/${id}`);
            get(todoRef)
                .then((snapshot) => {
                    const todo = snapshot.val();
                    if (todo) {
                        todo.completed = !todo.completed;
                        update(todoRef, todo)
                            .then(() => {
                                console.log("할 일 상태가 변경되었습니다.");
                            })
                            .catch((error) => {
                                console.error("할 일 상태 변경 중 오류 발생:", error);
                                alert('할 일 상태 변경 중 오류가 발생했습니다.');
                            });
                    }
                })
                .catch((error) => {
                    console.error("할 일 상태 변경 중 오류 발생:", error);
                    alert('할 일 상태 변경 중 오류가 발생했습니다.');
                });
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 할 일 삭제
function deleteTodo(id) {
    if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
        try {
            const user = auth.currentUser;
            if (user) {
                const todoRef = ref(database, `users/${user.uid}/todos/${id}`);
                remove(todoRef)
                    .then(() => {
                        console.log("할 일이 삭제되었습니다.");
                    })
                    .catch((error) => {
                        console.error("할 일 삭제 중 오류 발생:", error);
                        alert('할 일 삭제 중 오류가 발생했습니다.');
                    });
            }
        } catch (error) {
            console.error("오류 발생:", error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
    }
}

// 메모 저장/수정
function saveMemo() {
    try {
        if (!memoTitle.value.trim() || !memoContent.value.trim()) {
            alert('제목과 내용을 모두 입력해주세요!');
            return;
        }

        const user = auth.currentUser;
        if (user) {
            const memoRef = ref(database, `users/${user.uid}/memos`);
            const newMemoRef = push(memoRef);
            set(newMemoRef, {
                title: memoTitle.value.trim(),
                content: memoContent.value.trim(),
                important: memoImportant.checked,
                updatedAt: new Date().toISOString()
            });
            console.log("메모가 저장되었습니다.");
            resetForm();
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 메모 불러오기
function loadMemos() {
    try {
        memosContainer.innerHTML = '';
        
        const user = auth.currentUser;
        if (user) {
            const memoRef = ref(database, `users/${user.uid}/memos`);
            const queryRef = query(memoRef, orderByChild('updatedAt'));
            
            onValue(queryRef, (snapshot) => {
                const memos = [];
                snapshot.forEach((childSnapshot) => {
                    const memo = childSnapshot.val();
                    memo.id = childSnapshot.key;
                    memos.push(memo);
                });
                
                memos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                
                memos.forEach((memo) => {
                    const memoElement = createMemoElement(memo.id, memo);
                    memosContainer.appendChild(memoElement);
                });
            }, (error) => {
                console.error("메모 불러오기 중 오류 발생:", error);
                alert('메모를 불러오는 중 오류가 발생했습니다.');
            });
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 메모 요소 생성
function createMemoElement(id, memo) {
    const div = document.createElement('div');
    div.className = `memo ${memo.important ? 'important' : ''}`;
    
    div.innerHTML = `
        <h3>${memo.title}</h3>
        <p>${memo.content}</p>
        <div class="memo-footer">
            <span class="date">${new Date(memo.updatedAt).toLocaleString()}</span>
            <div class="memo-actions">
                <button onclick="editMemo('${id}')" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteMemo('${id}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// 메모 수정
function editMemo(id) {
    try {
        const user = auth.currentUser;
        if (user) {
            const memoRef = ref(database, `users/${user.uid}/memos/${id}`);
            get(memoRef)
                .then((snapshot) => {
                    const memo = snapshot.val();
                    if (memo) {
                        memoTitle.value = memo.title;
                        memoContent.value = memo.content;
                        memoImportant.checked = memo.important;
                        
                        editingMemoId = id;
                        saveBtn.textContent = '수정';
                        cancelBtn.style.display = 'inline-block';
                        
                        document.querySelector('.memo-form').scrollIntoView({ behavior: 'smooth' });
                    }
                })
                .catch((error) => {
                    console.error("메모 수정 중 오류 발생:", error);
                    alert('메모 수정 중 오류가 발생했습니다.');
                });
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 메모 삭제
function deleteMemo(id) {
    if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
        try {
            const user = auth.currentUser;
            if (user) {
                const memoRef = ref(database, `users/${user.uid}/memos/${id}`);
                remove(memoRef)
                    .then(() => {
                        console.log("메모가 삭제되었습니다.");
                    })
                    .catch((error) => {
                        console.error("메모 삭제 중 오류 발생:", error);
                        alert('메모 삭제 중 오류가 발생했습니다.');
                    });
            }
        } catch (error) {
            console.error("오류 발생:", error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
    }
}

// 폼 초기화
function resetForm() {
    memoTitle.value = '';
    memoContent.value = '';
    memoImportant.checked = false;
    editingMemoId = null;
    saveBtn.textContent = '저장';
    cancelBtn.style.display = 'none';
}

// 이벤트 리스너
addTodoBtn.addEventListener('click', addTodo);
saveBtn.addEventListener('click', saveMemo);
cancelBtn.addEventListener('click', resetForm);

// 전역 함수로 설정
window.deleteTodo = deleteTodo;
window.toggleTodo = toggleTodo;
window.deleteMemo = deleteMemo;
window.editMemo = editMemo;

// 초기 데이터 로드
loadTodos();
loadMemos(); 