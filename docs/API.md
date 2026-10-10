# KajianNow API

The kajian schedules behind KajianNow are open. If you are building something
for the ummah, such as a bot for your group, a schedule widget for your
masjid's website, a map, or research on dakwah in Indonesia, you are welcome
to use them. Free, no sign-up, no key.

> Silakan dipakai untuk kebaikan. Gratis, tanpa daftar, tanpa kunci.

- **Base URL:** `https://kajian-api.derrylab.com`
- **Interactive docs:** [`/docs`](https://kajian-api.derrylab.com/docs) (try requests in the browser) and [`/redoc`](https://kajian-api.derrylab.com/redoc)
- **OpenAPI spec:** [`/openapi.json`](https://kajian-api.derrylab.com/openapi.json), for generating a client

## Quick start

```sh
# Today's kajian (Asia/Jakarta date)
curl "https://kajian-api.derrylab.com/schedule"

# A given day
curl "https://kajian-api.derrylab.com/schedule?date=2026-10-17"

# Search: a speaker's kajian in Depok this month
curl "https://kajian-api.derrylab.com/query_schedules?speaker=abu%20salma&city=depok&date=2026-10"

# When the schedules last changed, so you know when to fetch again
curl "https://kajian-api.derrylab.com/last_update"
```

```js
const res = await fetch("https://kajian-api.derrylab.com/schedule?date=2026-10-17");
const kajian = await res.json(); // an array of schedules
```

## Endpoints

| Method | Path | What it does | Limit per IP |
|---|---|---|---|
| GET | `/schedule?date=YYYY-MM-DD` | Every kajian on one day; today if `date` is left out | 120/min |
| GET | `/query_schedules?...` | Search, see below | 60/min |
| GET | `/last_update` | When the schedules last changed | |
| GET | `/comment_counts?date=YYYY-MM-DD` | Comment count per kajian for a day | 120/min |
| GET | `/comments/{schedule_id}` | A kajian's comment thread | 120/min |
| POST | `/comments/{schedule_id}` | Post a comment or a reply | 10/min |
| DELETE | `/comments/{comment_id}?vid=...` | Delete your own comment | 30/min |
| POST | `/react/{schedule_id}?type=like\|going&op=add\|remove` | Like a kajian, or mark that you are going | 120/min |
| GET | `/push/vapid_public` | The public key for Web Push | |
| POST / DELETE | `/push/subscribe` | Subscribe a browser to reminders near a location | 60/min |
| GET | `/stats` | Daily usage numbers, as on the [dashboard](https://kajian-api.derrylab.com/dashboard) | 120/min |
| GET | `/health` | Whether the service is up | |

Going over a limit answers `429`; wait a minute and try again.

### Searching

`/query_schedules` takes any of these filters, all optional, and combines
them. A value matches part of the field and ignores case, so `city=jakarta`
finds every Jakarta area.

`speaker`, `topic`, `book`, `city`, `addr`, `loc_name`, `tags`, `day` (Indonesian
day name, e.g. `sabtu`), `date` (`YYYY-MM-DD`, or `YYYY-MM` for a whole
month), `time_start`, `time_end`, `notes`.

### A schedule

```json
{
  "id": "880c49c6-f541-4840-8a99-cbde515260be",
  "date": "2026-10-10",
  "day": "sabtu",
  "time_start": "08:30",
  "time_end": "11:30",
  "speaker": "Ustadz Abu Salma Muhammad, S. Si",
  "topic": "Agar Anak Setaat Nabi Ismail",
  "book": "",
  "tags": "tematik, anak",
  "loc_name": "Sekolah Daarul Atsar (SDA)",
  "addr": "Pasir Putih, Sawangan, Depok, Jawa Barat",
  "city": "Depok",
  "lat": "-6.431429",
  "lng": "106.775726",
  "gmaps_url": "",
  "contact": "…",
  "notes": "",
  "likes": "0",
  "going": "0",
  "src_platform": "TG-Userbot-Py",
  "src_image": "images/…",
  "added_at": "2026-10-03 07:26:28"
}
```

Times are Western Indonesia time (WIB, Asia/Jakarta). `src_image` and
`src_text` are paths under the base URL to the poster or message the
schedule was read from.

### `vid`

Some endpoints take a `vid`: an anonymous visitor id. Make up a random UUID
once, keep it (for example in `localStorage`), and send it along. It counts
unique visitors without knowing who anyone is, and it is how the API knows
which comments are yours to delete.

## Please

- **Cache.** Schedules change a few times a day. Check `/last_update` and
  fetch again only when it moves, rather than on every page view.
- **Say where it came from.** "Data: KajianNow (kajian.derrylab.com)", with a
  link, is enough.
- **Point people to the source.** Schedules are sent in by the community and
  read from posters by a program, so a time or a place can be wrong. Show
  `src_image` or the contact so people can check with the organiser before
  they travel.
- **Respect the people in the data.** Contacts are there so people can ask
  about a kajian. Do not collect them for anything else.
- Comments and reactions are public and anonymous; keep them to what you
  would say in the majelis.

## Not public

Adding, editing or removing schedules is done by the KajianNow team and its
bots, with a key that is not published. Those endpoints are not in the docs.
To get a kajian listed, or to report a wrong one, open an issue in
[this repository](https://github.com/jadwal-kajian/kajiannow-ui/issues).

## Questions

Open an [issue](https://github.com/jadwal-kajian/kajiannow-ui/issues). If you
build something with the API, we would love to hear about it there too.
