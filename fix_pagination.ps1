$f = 'C:\Users\Reckitt\Documents\antigravity\epic-mendeleev\src\app\report\page.tsx'
$lines = Get-Content $f

$before = $lines[0..150]
$after  = $lines[188..($lines.Length - 1)]

$newBlock = @(
  '  return (',
  '    <>',
  '      <div className="mt-4 text-sm text-muted-foreground text-center">Page {page} of {totalPages}</div>',
  '      <Pagination>',
  '        <PaginationContent>',
  '          <PaginationItem>',
  '            <PaginationPrevious',
  '              href="#"',
  '              onClick={e => { e.preventDefault(); if (page > 1) onChange(page - 1); }}',
  '              aria-disabled={page <= 1}',
  '              className={page <= 1 ? "pointer-events-none opacity-50" : ""}',
  '            />',
  '          </PaginationItem>',
  '          {pages.map((p, i) =>',
  '            p === "ellipsis" ? (',
  '              <PaginationItem key={`ell-${i}`}><PaginationEllipsis /></PaginationItem>',
  '            ) : (',
  '              <PaginationItem key={p}>',
  '                <PaginationLink',
  '                  href="#"',
  '                  isActive={p === page}',
  '                  onClick={e => { e.preventDefault(); onChange(p); }}',
  '                >',
  '                  {p}',
  '                </PaginationLink>',
  '              </PaginationItem>',
  '            )',
  '          )}',
  '          <PaginationItem>',
  '            <PaginationNext',
  '              href="#"',
  '              onClick={e => { e.preventDefault(); if (page < totalPages) onChange(page + 1); }}',
  '              aria-disabled={page >= totalPages}',
  '              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}',
  '            />',
  '          </PaginationItem>',
  '        </PaginationContent>',
  '      </Pagination>',
  '    </>',
  '  );'
)

$result = $before + $newBlock + $after
Set-Content -Path $f -Value $result -Encoding UTF8
Write-Host "Done: $($result.Length) lines"
