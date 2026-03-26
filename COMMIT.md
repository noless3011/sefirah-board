Để commit 1 tính năng/chỉnh sửa thì ae cần tạo cho t 1 cái branch tách ra từ nhánh develop với tên kiểu như sau: <loại chỉnh sửa>/<tên mô tả chỉnh sửa>
Cú pháp git:
< nhớ git switch sang develop trước>
git switch develop 
git switch -c <tên nhánh>
À để cho đẹp thì ae viết cách ra bằng dấu - nhé
kiểu
git switch -c feat/add-new-login-page
các loại chỉnh sửa thì có mấy cái sau, còn tên nhánh thì ae tự múa:

feat: Thêm một tính năng mới.

fix: Sửa lỗi (bug).

refactor: Sửa đổi code nhưng không làm thay đổi logic (không thêm tính năng, không sửa lỗi).

style: Cập nhật UI, CSS, hoặc format code (dấu cách, tab, thiếu dấu phẩy...) không ảnh hưởng đến logic chạy.

docs: Thêm/sửa đổi tài liệu (README, comments...).

perf: Cải thiện hiệu năng (performance).

test: Thêm mới hoặc sửa các test case.

chore: Cập nhật cấu hình build, package manager, thư viện (không sửa production code).

Ok, sau khi tạo nhánh trên local thì ae vào viết code, git add, git commit các kiểu.
Sau khi ổn r thì ae chạy
git push --set-upstream origin <tên cái nhánh hiện tại của ae>
lúc này thì nhánh của ae sẽ lên github r,
Lúc này cần lên github, tạo 1 cái pull request, nhớ là từ nhánh của ae vào develop.
Xong thì nhắn zalo cho t vào check nhé, đừng tự merge, k là bung bét á
OK thì t sẽ merge cho ae.
Đây là quy trình tiêu chuẩn
Nhớ nhé, t sẽ lock cái nhánh develop lại nên ae k up lên đó đc đâu, sửa 1 chữ cũng cần 1 nhánh. (Sau ae đi làm cty đều thế cả, làm quen dần đi :v )