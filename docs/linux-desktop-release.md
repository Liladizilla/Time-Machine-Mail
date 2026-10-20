# Linux desktop release checks

The Linux desktop release workflow builds the AppImage and Debian package independently of the Windows and macOS jobs. This keeps a slow cross-platform build from blocking a Linux hotfix.

Before publishing, CI extracts the AppImage and checks that:
- `resources/app/server.js` exists.
- `resources/app/node_modules/next/package.json` exists.
- Node.js can resolve the packaged `next` runtime from the app directory.

These checks validate the package contents and module resolution. They do not replace launching the AppImage on a real desktop session.

## Fedora smoke test

After downloading the AppImage from the GitHub release page:

```bash
chmod +x Time.Machine.Mail-0.1.2-x86_64.AppImage
./Time.Machine.Mail-0.1.2-x86_64.AppImage
```

If startup fails, capture the Electron and application logs:

```bash
./Time.Machine.Mail-0.1.2-x86_64.AppImage --enable-logging=stderr 2>&1 | tee ~/time-machine-mail-error.log
```

The existing user configuration is stored separately under `~/.config/time-machine-mail/config.json`; do not paste Supabase credentials into issue reports.
