# Releasing Guide

Hướng dẫn quy trình phát hành phiên bản mới cho `ccpoke`.

## Tổng quan quy trình

```
Code changes → Bump version → Git tag → npm publish → GitHub Release → Thông báo
```

---

## 1. Trước khi release

### Checklist bắt buộc

- [ ] Code đã merge vào `main`
- [ ] Tất cả thay đổi đã commit (working tree sạch)
- [ ] Build thành công: `npm run build`
- [ ] Test thủ công các tính năng chính
- [ ] README đã cập nhật nếu có thay đổi API/tính năng

### Kiểm tra trạng thái

```bash
git status
npm run build
```

---

## 2. Bump version

Dùng `npm version` để tăng version tự động. Lệnh này sẽ:
- Cập nhật `version` trong `package.json`
- Tạo git commit với message `v<version>`
- Tạo git tag `v<version>`

### Chọn loại version theo Semantic Versioning

| Loại | Lệnh | Ví dụ | Khi nào dùng |
|------|-------|-------|--------------|
| **patch** | `npm version patch` | 1.0.0 → 1.0.1 | Fix bug, không đổi API |
| **minor** | `npm version minor` | 1.0.0 → 1.1.0 | Thêm feature, backward compatible |
| **major** | `npm version major` | 1.0.0 → 2.0.0 | Breaking changes |

### Ví dụ: release bản patch

```bash
npm version patch -m "v%s"
```

Flag `-m "v%s"` tùy chỉnh commit message. `%s` sẽ được thay bằng version mới.

---

## 3. Publish lên npm

```bash
npm publish
```

Lệnh `prepublishOnly` sẽ tự động chạy `npm run build` trước khi publish.

### Xác minh sau publish

```bash
npm view ccpoke version
npm view ccpoke versions --json
```

---

## 4. Push lên GitHub

```bash
git push origin main --follow-tags
```

Flag `--follow-tags` đảm bảo push cả tag lên remote.

---

## 5. Tạo GitHub Release

### Cách 1: Dùng GitHub CLI (khuyến nghị)

```bash
gh release create v1.0.1 --title "v1.0.1" --notes "### Changes
- Fix: mô tả bug đã fix
- Improve: mô tả cải tiến"
```

### Cách 2: Trên giao diện GitHub

1. Vào **Releases** → **Draft a new release**
2. Chọn tag vừa push (ví dụ `v1.0.1`)
3. Điền title và release notes
4. Click **Publish release**

### Cấu trúc Release Notes

```markdown
## What's Changed

### 🚀 Features
- Thêm tính năng X (#issue)

### 🐛 Bug Fixes
- Fix lỗi Y khi Z (#issue)

### 📝 Documentation
- Cập nhật hướng dẫn cài đặt

### ⚠️ Breaking Changes
- Đổi tên command `abc` thành `xyz`
```

---

## 6. Quy trình release hoàn chỉnh (copy-paste)

```bash
# 1. Đảm bảo code sạch
git status

# 2. Build kiểm tra
npm run build

# 3. Bump version (chọn patch/minor/major)
npm version patch -m "v%s"

# 4. Publish lên npm
npm publish

# 5. Push code + tag lên GitHub
git push origin main --follow-tags

# 6. Tạo GitHub Release (cần cài gh CLI)
gh release create v$(node -p "require('./package.json').version") \
  --title "v$(node -p "require('./package.json').version")" \
  --generate-notes
```

---

## Semantic Versioning chi tiết

Format: `MAJOR.MINOR.PATCH`

### PATCH (1.0.x)
- Fix bug
- Cải thiện performance
- Refactor nội bộ không ảnh hưởng API

### MINOR (1.x.0)
- Thêm command mới
- Thêm option mới cho command hiện tại
- Thêm tính năng mà không phá code cũ

### MAJOR (x.0.0)
- Đổi tên command
- Xóa command/option
- Thay đổi hành vi mặc định
- Đổi cấu trúc config file
- Nâng minimum Node.js version

---

## Pre-release versions

Khi muốn test trước khi release chính thức:

```bash
# Beta
npm version prerelease --preid=beta
# → 1.1.0-beta.0, 1.1.0-beta.1, ...

# Publish với tag beta (không ảnh hưởng @latest)
npm publish --tag beta
```

User cài bản beta:
```bash
npx ccpoke@beta
```

---

## Rollback khi publish nhầm

### Unpublish (trong vòng 72 giờ)

```bash
npm unpublish ccpoke@1.0.1
```

### Deprecate (sau 72 giờ hoặc muốn cảnh báo)

```bash
npm deprecate ccpoke@1.0.1 "Version này có bug, vui lòng dùng 1.0.2"
```

---

## Lưu ý quan trọng

1. **Không bao giờ** publish từ branch khác `main`
2. **Không bao giờ** sửa tay `version` trong `package.json` — luôn dùng `npm version`
3. **Không bao giờ** publish lại cùng version number — npm không cho phép
4. **Luôn** kiểm tra `npm publish --dry-run` trước khi publish thật
5. **Luôn** push tag lên GitHub sau khi publish
