// Affiche la fenêtre de confirmation.
// Renvoie une promesse : true si l'utilisateur confirme, false s'il annule.
export function askConfirmation(title, text, confirmLabel) {
    const overlay = document.getElementById('modal-overlay');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    confirmBtn.textContent = confirmLabel;
    overlay.hidden = false;
    cancelBtn.focus();   // par défaut, le focus est sur « Annuler » (plus prudent)

    return new Promise(function (resolve) {
        function close(result) {
            overlay.hidden = true;
            document.removeEventListener('keydown', onKey);
            resolve(result);
        }

        function onKey(event) {
            if (event.key === 'Escape') {
                close(false);
            }
        }

        confirmBtn.onclick = function () { close(true); };
        cancelBtn.onclick = function () { close(false); };
        overlay.onclick = function (event) {
            if (event.target === overlay) {   // clic à côté de la fenêtre
                close(false);
            }
        };
        document.addEventListener('keydown', onKey);
    });
}