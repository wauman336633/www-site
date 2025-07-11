import { price } from './data/price.js'; // named exportとしてインポート

document.addEventListener('DOMContentLoaded', () => {
    const formFields = document.getElementById('form-fields');
    const totalPriceElement = document.getElementById('total-price');
    const registerPriceElement = document.getElementById('register-price');
    const formControlElement = document.getElementById('form-control');

    // フォームのフィールドを生成
    Object.keys(price).forEach(category => {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);

        // 各カテゴリの選択肢をチェックボックスで追加
        Object.keys(price[category]).forEach(level => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = price[category][level];
            checkbox.setAttribute('data-category', category);
            checkbox.setAttribute('data-level', level);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`${level} (${price[category][level].toLocaleString()}円)`));
            fieldset.appendChild(label);
            
        });

        formFields.appendChild(fieldset);
    });

    // 合計金額を計算
    formFields.addEventListener('change', () => {
        let total = 0;
        const checkboxes = formFields.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const value = parseInt(checkbox.value, 10);
            if (!isNaN(value)) {
                total += value;
            }
        });
        // 合計金額を表示
        totalPriceElement.textContent = total.toLocaleString();
        registerPriceElement.textContent = (total*0.3).toLocaleString();
    });

    // Submitボタンを追加
    const submitButton = document.createElement('button');
    submitButton.textContent = '収支報告フォームに送信';
    submitButton.type = 'button';
    submitButton.addEventListener('click', () => {
        const checkboxes = formFields.querySelectorAll('input[type="checkbox"]:checked');
        const selectedItems = Array.from(checkboxes).map(checkbox => {
            const category = checkbox.getAttribute('data-category');
            const level = checkbox.getAttribute('data-level');
            return `${category} (${level})`;
        }).join(', ');

        const total = totalPriceElement.textContent.replace(/,/g, ''); // 合計金額を取得
        const googleFormURL = `https://docs.google.com/forms/d/e/1FAIpQLScoaUD7j_OMxA62nRL27xQQ0xtAASm9200pPOmJSJttPOMl8w/viewform?usp=pp_url&entry.62649312=性能カスタム（収入）&entry.56986843=${total*0.3}&entry.367017110=${encodeURIComponent(selectedItems)}`;

        window.open(googleFormURL, '_blank'); // Googleフォームを新しいタブで開く
    });


    // リセットボタンを追加
    const resetButton = document.createElement('button');
    resetButton.textContent = 'リセット';
    resetButton.type = 'button';
    resetButton.addEventListener('click', () => {
        const checkboxes = formFields.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false; // チェックを解除
        });
        totalPriceElement.textContent = '0'; // 合計金額をリセット
    });

    formControlElement.appendChild(resetButton); // ボタンをページに追加
    formControlElement.appendChild(submitButton); // ボタンをページに追加
});