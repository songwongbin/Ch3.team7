const BASE_URL = 'http://localhost:3018/api'; // 백엔드 API 주소
let token = null; // 로그인 후 저장된 토큰

// 로그인 처리
document.getElementById('signInForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const loginId = document.getElementById('signInLoginId').value;
  const password = document.getElementById('signInPassword').value;

  try {
    const response = await fetch(`${BASE_URL}/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });

    const result = await response.json();
    if (response.ok) {
      token = result.token; // 토큰 저장
      alert(result.message);
    } else {
      alert(result.message || '로그인에 실패했습니다.');
    }
  } catch (error) {
    alert('오류가 발생했습니다.');
    console.error(error);
  }
});
