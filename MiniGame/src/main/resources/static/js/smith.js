// 이미지 기본 경로 설정 (스프링 부트 static 폴더 기준)
const IMG_BASE = "/assets/";

const stone = document.getElementById('stone');
const gameModal = document.getElementById('gameModal');
const gameClose = document.getElementById('gameClose');
const modalStone = document.getElementById('modalStone');
const gaugeBar = document.getElementById('gaugeBar');
const cursor = document.getElementById('cursor');
const pickaxe = document.getElementById('pickaxe');
const successCountSpan = document.getElementById('successCount');
const failCountSpan = document.getElementById('failCount');
const innerModal = document.getElementById('innerModal');
const innerClose = document.getElementById('innerClose');
const failModal = document.getElementById('failModal');
const failClose = document.getElementById('failClose');
const rewardTitle = document.getElementById('rewardTitle');
const rewardText = document.getElementById('rewardText');
const difficultyText = document.getElementById('difficulty-text');
const leftArrow = document.getElementById('left-arrow');
const rightArrow = document.getElementById('right-arrow');
const yellowZones = [
    document.getElementById('yellowZone1'),
    document.getElementById('yellowZone2'),
    document.getElementById('yellowZone3')
];

const difficulties = [
    {
        name: '초보',
        speed: 2,
        zoneWidth: 50,
        rewards: [
            { file: 'stone.png', prob: 0.8 },
            { file: 'silver.png', prob: 0.15 },
            { file: 'gold.png', prob: 0.05 }
        ]
    },
    {
        name: '중수',
        speed: 1,
        zoneWidth: 30,
        rewards: [
            { file: 'stone.png', prob: 0.25 },
            { file: 'silver.png', prob: 0.4 },
            { file: 'gold.png', prob: 0.3 },
            { file: 'diamond.png', prob: 0.05 }
        ]
    },
    {
        name: '고수',
        speed: 0.75,
        zoneWidth: 20,
        rewards: [
            { file: 'silver.png', prob: 0.25 },
            { file: 'gold.png', prob: 0.55 },
            { file: 'diamond.png', prob: 0.2 }
        ]
    }
];

let currentDifficultyIndex = 0;
let successCount = 0;
let failCount = 0;
let gameActive = false;
let animationPaused = false;
let finalReward = '';

function setModalStone(name) { modalStone.src = IMG_BASE + name; }

function changeDifficulty(direction) {
    currentDifficultyIndex += direction;
    if (currentDifficultyIndex < 0) currentDifficultyIndex = difficulties.length - 1;
    else if (currentDifficultyIndex >= difficulties.length) currentDifficultyIndex = 0;
    difficultyText.textContent = difficulties[currentDifficultyIndex].name;
    applyDifficulty();
}
leftArrow.addEventListener('click', () => changeDifficulty(-1));
rightArrow.addEventListener('click', () => changeDifficulty(1));

function applyDifficulty() {
    const diff = difficulties[currentDifficultyIndex];
    cursor.style.animationDuration = diff.speed + 's';
    yellowZones.forEach((zone, i) => {
        zone.style.width = diff.zoneWidth + 'px';
        if(i===0) zone.style.left = '20%';
        else if(i===1) zone.style.left = '50%';
        else if(i===2) zone.style.left = '80%';
    });
}

stone.addEventListener('click', () => {
    gameModal.style.display = 'flex';
    startGame();
});

gameClose.addEventListener('click', closeGameModal);
window.addEventListener('click', (e) => { if(e.target===gameModal) closeGameModal(); });

function closeGameModal() {
    innerModal.style.display = 'none';
    failModal.style.display = 'none';
    gameModal.style.display = 'none';
    resetGame();
}

function startGame() {
    successCount = 0;
    failCount = 0;
    animationPaused = false;
    gameActive = true;
    updateStatus();
    applyDifficulty();
    cursor.classList.remove('paused');
    cursor.style.animationPlayState = 'running';
}

function resetGame() {
    gameActive = false;
    successCount = 0;
    failCount = 0;
    cursor.classList.add('paused');
    cursor.style.left = '0px';
    setModalStone('stone.png');
    updateStatus();
}

function updateStatus() {
    successCountSpan.textContent = successCount;
    failCountSpan.textContent = failCount;

    if (successCount === 1) setModalStone('stone1.png');
    else if (successCount === 2) setModalStone('stone2.png');
    else if (successCount >= 3) setModalStone('stone2.png');

    if (successCount >= 3 && !finalReward) {
        const rewards = difficulties[currentDifficultyIndex].rewards;
        finalReward = getRewardForDifficulty(rewards);
        setTimeout(() => {
            setModalStone(finalReward);
            rewardTitle.textContent = `🎉 ${getRewardName(finalReward)}을(를) 캤습니다! 🎉`;
            rewardText.textContent = `축하합니다. ${getRewardName(finalReward)}을(를) 획득했습니다.`;
            innerModal.style.display = 'flex';
            cursor.classList.add('paused');
            gameActive = false;
        }, 250);
    }

    if (failCount >= 3) {
        failModal.style.display = 'flex';
        cursor.classList.add('paused');
        gameActive = false;
    }
}

function getRewardForDifficulty(rewards) {
    const rand = Math.random();
    let cumulative = 0;
    for(const r of rewards){
        cumulative += r.prob;
        if(rand <= cumulative) return r.file;
    }
    return rewards[rewards.length - 1].file;
}

function getRewardName(file) {
    switch(file) {
        case 'stone.png': return '돌';
        case 'stone1.png': return '돌';
        case 'stone2.png': return '돌';
        case 'silver.png': return '은';
        case 'gold.png': return '금';
        case 'diamond.png': return '다이아몬드';
        default: return '광석';
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameActive && !animationPaused) {
        e.preventDefault();
        checkHit();
    }
});

function checkHit() {
    animationPaused = true;
    cursor.classList.add('paused');
    cursor.style.animationPlayState = 'paused';

    const cRect = cursor.getBoundingClientRect();
    const gRect = gaugeBar.getBoundingClientRect();
    const cursorCenter = cRect.left - gRect.left + cRect.width / 2;

    let hit = false;
    yellowZones.forEach((z) => {
        const zRect = z.getBoundingClientRect();
        const zStart = zRect.left - gRect.left;
        const zEnd = zStart + zRect.width;
        if (cursorCenter >= zStart && cursorCenter <= zEnd) hit = true;
    });

    if (hit) {
        successCount++;
        // 곡괭이 흔들림
        pickaxe.classList.add('swing');
        setTimeout(() => pickaxe.classList.remove('swing'), 300);
        // 돌 흔들림
        modalStone.classList.add('shake');
        setTimeout(() => modalStone.classList.remove('shake'), 300);
    } else {
        failCount++;
    }
    updateStatus();

    setTimeout(() => {
        animationPaused = false;
        if (successCount < 3 && failCount < 3) {
            cursor.classList.remove('paused');
            cursor.style.animationPlayState = 'running';
        }
    }, 400);
}

innerClose.addEventListener('click', () => { innerModal.style.display = 'none'; closeGameModal(); finalReward=''; });
failClose.addEventListener('click', () => { failModal.style.display = 'none'; closeGameModal(); finalReward=''; });

applyDifficulty();
resetGame();