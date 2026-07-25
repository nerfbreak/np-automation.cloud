$botFile = 'C:\Users\Reckitt\Documents\antigravity\epic-mendeleev\src\lib\newspage-bot.ts'
$content = [System.IO.File]::ReadAllText($botFile)

# Fix 1: Replace popup detection + click block with new dismissPopup helper
$oldBlock = @'
      // Cek dan handle popup peringatan (seperti peringatan item inactive) yang mungkin muncul dari baris sebelumnya
      const isPopupVisible = await frame.evaluate(() => {
        const bg = document.querySelector(".Popup_Background");
        return bg && (bg as HTMLElement).offsetHeight > 0;
      }).catch(() => false);

      if (isPopupVisible) {
        onProgress({ type: "log", message: "Popup peringatan terdeteksi, mengonfirmasi (Yes)..." })
        await frame.evaluate(() => {
          const yesBtns = document.querySelectorAll("[id$='pag_PopUp_YesNo_btn_Yes_Value']");
          for (let i = 0; i < yesBtns.length; i++) {
            if ((yesBtns[i] as HTMLElement).offsetHeight > 0) {
              (yesBtns[i] as HTMLElement).click();
              return;
            }
          }
        }).catch(() => {});
        await smartWait(page);
      }

      // Input SKU dengan simulasi ketikan asli (pressSequentially) supaya semua event JS di webforms ketrigger
      const skuInput = frame.locator("#pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value")
      await skuInput.click({ force: true }) // Gunakan force agar tidak tertahan kalau ada sisa overlay animasi
      await skuInput.fill("") // Clear dulu
      await skuInput.pressSequentially(row.sku, { delay: 10 })
      await page.waitForTimeout(100) // Kasih napas setelah ngetik SKU
'@

$newBlock = @'
      // Helper: dismiss popup YesNo kalau visible — dipanggil sebelum setiap interaksi form
      const dismissPopup = async () => {
        const visible = await frame.evaluate(() => {
          const bg = document.querySelector(".Popup_Background");
          return bg && (bg as HTMLElement).offsetHeight > 0;
        }).catch(() => false);
        if (visible) {
          onProgress({ type: "log", message: "Popup peringatan terdeteksi, mengonfirmasi (Yes)..." })
          await frame.evaluate(() => {
            const yesBtns = document.querySelectorAll("[id$='pag_PopUp_YesNo_btn_Yes_Value']");
            for (let j = 0; j < yesBtns.length; j++) {
              if ((yesBtns[j] as HTMLElement).offsetHeight > 0) {
                (yesBtns[j] as HTMLElement).click();
                return;
              }
            }
          }).catch(() => {});
          await smartWait(page);
          // Tunggu popup benar-benar hilang (max 5s) sebelum lanjut interaksi
          await frame.waitForFunction(() => {
            const bg = document.querySelector(".Popup_Background") as HTMLElement | null;
            return !bg || bg.offsetHeight === 0;
          }, {}, { timeout: 5000 }).catch(() => {});
        }
      }

      // Dismiss popup sebelum mulai interaksi SKU
      await dismissPopup();

      // Input SKU — gunakan JS langsung supaya aman untuk SKU dengan "/" dan karakter khusus
      // pressSequentially bisa gagal interpret "/" di VPS keyboard layout tertentu
      const skuInput = frame.locator("#pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value")
      await frame.evaluate((sku: string) => {
        const el = document.querySelector("#pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value") as HTMLInputElement | null;
        if (el) { el.focus(); el.value = sku; el.dispatchEvent(new Event("input", { bubbles: true })); }
      }, row.sku)
      await page.waitForTimeout(100) // Kasih napas setelah set SKU
'@

# Normalize CRLF in old block search pattern
$oldBlock = $oldBlock -replace "`r`n", "`n"
$content2 = $content -replace "`r`n", "`n"

if ($content2.Contains($oldBlock)) {
    $content2 = $content2.Replace($oldBlock, $newBlock)
    [System.IO.File]::WriteAllText($botFile, $content2, [System.Text.UTF8Encoding]::new($false))
    Write-Host "PATCHED_OK"
} else {
    # Try with CRLF in pattern
    $oldBlockCRLF = $oldBlock -replace "`n", "`r`n"
    if ($content.Contains($oldBlockCRLF)) {
        $content = $content.Replace($oldBlockCRLF, $newBlock)
        [System.IO.File]::WriteAllText($botFile, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "PATCHED_OK_CRLF"
    } else {
        Write-Host "NOT_FOUND"
        # Debug: print chars around isPopupVisible
        $idx = $content.IndexOf("isPopupVisible")
        Write-Host "isPopupVisible at index: $idx"
        if ($idx -ge 0) { Write-Host ($content.Substring([Math]::Max(0,$idx-20), 60)) }
    }
}
