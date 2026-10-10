let recordsData = [];

// データの取得
async function fetchRecords() {
    try {
        const response = await fetch('/api/records');
        let rawData = await response.json();
        
        // 名前順 > 日数順 にソートして同じ人のデータをまとめる
        recordsData = rawData.sort((a, b) => {
            if (a.participant_name !== b.participant_name) {
                return a.participant_name.localeCompare(b.participant_name, 'ja');
            }
            return (a.day_number || 0) - (b.day_number || 0);
        });
        
        populateNameFilter(recordsData);
        renderTable(recordsData);
    } catch (error) {
        console.error('データの取得に失敗しました', error);
    }
}

// テーブルへの描画
function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    data.forEach(record => {
        const tr = document.createElement('tr');
        
        // 日時のフォーマット
        const dateObj = new Date(record.created_at);
        const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

        tr.innerHTML = `
            <td>${record.id}</td>
            <td>${record.day_number || ''}日目</td>
            <td>${escapeHTML(record.record_date || '')}</td>
            <td>${escapeHTML(record.participant_name)}</td>
            <td>${record.bedtime}</td>
            <td>${record.waketime}</td>
            <td>${escapeHTML(record.weather)}</td>
            <td>${record.sunlight_completed ? '✅ 完了' : '❌ 未完了'}</td>
            <td>${escapeHTML(record.q1 || '')}</td>
            <td>${escapeHTML(record.q2 || '')}</td>
            <td>${escapeHTML(record.q3 || '')}</td>
            <td>${escapeHTML(record.q4 || '')}</td>
            <td>${escapeHTML(record.q5 || '')}</td>
            <td>${escapeHTML(record.q6 || '')}</td>
            <td>${escapeHTML(record.q7 || '')}</td>
            <td>${escapeHTML(record.q8 || '')}</td>
            <td>${formattedDate}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 氏名フィルターのプルダウンを生成
function populateNameFilter(data) {
    const filterSelect = document.getElementById('name-filter');
    const uniqueNames = [...new Set(data.map(item => item.participant_name))].sort((a, b) => a.localeCompare(b, 'ja'));
    
    uniqueNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        filterSelect.appendChild(option);
    });
}

// フィルター変更時の処理
document.getElementById('name-filter').addEventListener('change', (e) => {
    const selectedName = e.target.value;
    if (selectedName === "") {
        renderTable(recordsData); // 全件表示
    } else {
        const filteredData = recordsData.filter(record => record.participant_name === selectedName);
        renderTable(filteredData);
    }
});

// 簡単なXSS対策
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// CSVダウンロード
document.getElementById('download-csv').addEventListener('click', () => {
    if (recordsData.length === 0) {
        alert('ダウンロードするデータがありません。');
        return;
    }

    // BOMを追加してExcelでの文字化けを防ぐ
    let csvContent = "\uFEFF"; 
    
    // ヘッダー行
    const headers = ["ID", "調査日数", "日付", "氏名", "就寝時刻", "起床時刻", "天気", "太陽光完了", "Q1.心静か", "Q2.頭すっきり", "Q3.くつろいだ", "Q4.楽にできる", "Q5.生き生き", "Q6.元気", "Q7.引き締まり", "Q8.充実", "記録日時"];
    csvContent += headers.join(',') + "\r\n";

    // データ行
    recordsData.forEach(row => {
        const rowData = [
            row.id,
            row.day_number || '',
            `"${(row.record_date || '').replace(/"/g, '""')}"`,
            `"${row.participant_name.replace(/"/g, '""')}"`,
            row.bedtime,
            row.waketime,
            `"${row.weather}"`,
            row.sunlight_completed ? 'TRUE' : 'FALSE',
            `"${(row.q1 || '').replace(/"/g, '""')}"`,
            `"${(row.q2 || '').replace(/"/g, '""')}"`,
            `"${(row.q3 || '').replace(/"/g, '""')}"`,
            `"${(row.q4 || '').replace(/"/g, '""')}"`,
            `"${(row.q5 || '').replace(/"/g, '""')}"`,
            `"${(row.q6 || '').replace(/"/g, '""')}"`,
            `"${(row.q7 || '').replace(/"/g, '""')}"`,
            `"${(row.q8 || '').replace(/"/g, '""')}"`,
            row.created_at
        ];
        csvContent += rowData.join(',') + "\r\n";
    });

    // ダウンロード処理
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `research_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 初期実行
fetchRecords();
