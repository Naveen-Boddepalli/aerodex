# systemd units

The timer template takes the slot id as its instance name, but `OnCalendar`
cannot read a clock time from `%i` — install one drop-in per slot:

```
/etc/systemd/system/aerodex-collect@morning.timer.d/schedule.conf
  [Timer]
  OnCalendar=*-*-* 07:00:00

/etc/systemd/system/aerodex-collect@afternoon.timer.d/schedule.conf
  [Timer]
  OnCalendar=*-*-* 13:00:00

/etc/systemd/system/aerodex-collect@evening.timer.d/schedule.conf
  [Timer]
  OnCalendar=*-*-* 20:00:00
```

Then:

```bash
sudo timedatectl set-timezone Asia/Kolkata
sudo systemctl enable --now aerodex-collect@morning.timer \
                            aerodex-collect@afternoon.timer \
                            aerodex-collect@evening.timer
systemctl list-timers 'aerodex-*'
```

Verify actual fire times against `journalctl -u aerodex-collect@morning.service`
for a week before trusting M3 — the plan's whole objection to GitHub Actions
cron is drift, and an unverified timer is the same risk with a different name.
