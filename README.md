# Портфолио — деплой на atimofeev.tech

Статический сайт (HTML/CSS/JS, без сборки) — заливается на хостинг «как есть».

## 1. Залить репозиторий на GitHub

```bash
git remote add origin https://github.com/<твой-юзернейм>/<имя-репо>.git
git push -u origin master
```

(Создать пустой репозиторий заранее на github.com — без README/лицензии, чтобы не было конфликтов.)

## 2. Подключить хостинг (Vercel или Netlify — оба бесплатны)

**Vercel**: New Project → Import Git Repository → выбрать репо → Framework Preset: "Other" →
Build Command и Output Directory оставить пустыми (сайт статический, ничего собирать не нужно) → Deploy.

**Netlify**: Add new site → Import an existing project → выбрать репо → Build command: пусто,
Publish directory: `.` → Deploy.

После этого каждый `git push` в `master` автоматически обновляет сайт за ~10–20 секунд.

## 3. Подключить домен atimofeev.tech

В настройках проекта на Vercel/Netlify — Domains → Add Domain → `atimofeev.tech`.
Хостинг покажет DNS-записи (обычно A-запись или CNAME) — их нужно прописать у регистратора,
где куплен домен. DNS-изменения применяются от нескольких минут до суток.

## Дальнейшие правки

```bash
# отредактировать файлы
git add .
git commit -m "описание правки"
git push
```

Правки применяются на сайте автоматически, без ручной загрузки файлов — можно работать с любого
устройства, где есть git (или прямо в вебе через GitHub).
