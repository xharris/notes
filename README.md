# themepark

## TODO

- [x] search for rides
- [x] add button on ride to trigger entry modal
  - need to polish a bit. the search list doesn't update when adding a new entry. in order to do that there may need to be a bit of restructuring for RideList (adding a rideUpdated callback?).
- [x] search for user
- [x] sign in/out button
- [x] improve sign up flow (doesn't move to previous page?)
- [x] view different user's profile / other entry (check that it looks fine)
- [x] user settings
- [ ] follow a user
- [ ] following/followed list
- [ ] view ride (image, name, top 10 or so tags, )
- [ ] if search results are empty, show 'request ride addition' button, show form for adding a ride (name)
  - [ ] if park is not found, extend form for adding park too (name, address)
- [ ] mobile styling
- [ ] turn website into PWA
- [ ] pin a park. shows park and rides on home page for easy entry adding/editing (+1 button)
- [ ] auto-pin. pin park withing a certain geological radius.

## POLISH

- [ ] try GraphQL
- [ ] search bar on profile (filter by tags / search by ride name / park name)
- [ ] CI for updating live server (lock main branch and only allow PRs)
- [ ] home shows feed of followed user entries
- [ ] use react-loading-skeleton?
- [ ] shared element transitions
- [ ] stats page
- [ ] ride stats (based on entries)
- [ ] PWA offline capabilities
  - [ ] can edit list while offline
  - [ ] can use current location
  - [ ] if currently very close to parks, saves ride data for nearby parks for offline use (can be turned off in settings)
- [ ] ridesearch is sorted by closest park
