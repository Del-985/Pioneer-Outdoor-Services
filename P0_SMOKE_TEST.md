# Pioneer Outdoor Services — P0 Launch Smoke Test

Run this checklist after any change to the public service-request flow, backend contact pipeline, DNS, or admin Contacts feature.

## Automated deployment checks

- [x] Pioneer Backend TypeScript CI passes on the P0 contact/idempotency changes.
- [x] Pioneer Backend Render service auto-deploys from `main`.
- [x] Backend `start` runs database migrations before starting the server.
- [x] Pioneer Admin GitHub Pages deployment passes with the expanded Contacts lead view.
- [x] Pioneer Outdoor Services GitHub Pages deployment passes with the P0 public-site files.

## Homepage — desktop

- [ ] Open `https://pioneeroutdoorservices.com/` at a desktop viewport.
- [ ] Header navigation reaches Services, Pricing, Service Area, About, and Request Service.
- [ ] Hero pricing shows driveway service starting at $40.
- [ ] Salting displays $20 everywhere.
- [ ] Full Service Details opens `services.html`.
- [ ] Privacy opens `privacy.html`.
- [ ] No horizontal scrolling occurs.

## Homepage — mobile

Test at approximately 390×844 and 360×800.

- [ ] Mobile menu opens and closes from the menu button.
- [ ] Menu closes after selecting a link.
- [ ] Menu closes on outside tap and Escape when a keyboard is available.
- [ ] Background page does not scroll while the menu is open.
- [ ] Buttons and form controls are comfortably tappable.
- [ ] Form controls do not trigger unwanted iOS input zoom.
- [ ] Service, pricing, process, and footer layouts collapse cleanly to one column.
- [ ] No horizontal scrolling occurs.

## Service-area validation

- [ ] ZIP `43604` displays primary Toledo service-area messaging and can submit.
- [ ] ZIP `43560` displays nearby-area review messaging and can submit.
- [ ] A valid ZIP outside `435xx`/`436xx` is blocked with an outside-service-area message.
- [ ] An invalid ZIP is rejected and focus returns to the ZIP field.

## Price estimate

- [ ] Single-car driveway with no add-ons estimates $40.
- [ ] Two-car driveway with no add-ons estimates $50.
- [ ] Sidewalk adds $20.
- [ ] Salting adds $20.
- [ ] Sidewalk + salting adds $40 total.
- [ ] Recurring service labels the amount as a per-clearing starting price.
- [ ] Larger/custom driveway displays quote required.
- [ ] Sidewalk-only displays quote required and requires sidewalk clearing to be selected.

## Form validation and accessibility

- [ ] Name is required.
- [ ] At least one of phone/email is required.
- [ ] Invalid email is rejected.
- [ ] Street address, city, ZIP, driveway size, and frequency are required.
- [ ] Invalid field receives focus and `aria-invalid`.
- [ ] Error text is associated with the invalid control.
- [ ] Form can be completed with keyboard only.
- [ ] Focus indicators remain visible.

## Successful service request

Use test contact information and a clearly labeled test note.

- [ ] Submit a valid `436xx` request.
- [ ] Submit button disables while the request is in flight.
- [ ] Receipt confirmation replaces the form after success.
- [ ] Confirmation shows reference, property, service, add-ons, starting price, and next step.
- [ ] “Submit Another Request” restores a clean form and creates a new request id.

## Duplicate protection

- [ ] Submit a request and record its reference.
- [ ] Retry the same browser request before resetting the form/request id.
- [ ] Backend returns the same submission instead of creating a second contact.
- [ ] Only the original request queues a notification.

## Error behavior

- [ ] Network failure leaves entered form values intact.
- [ ] Server 5xx shows a temporary-unavailable message and leaves the form intact.
- [ ] HTTP 429 shows the rate-limit message.
- [ ] HTTP 403 shows the origin-configuration message.
- [ ] Submit button re-enables after failed requests.

## Admin lead review

In `https://admin.pioneerlegacyworks.com`, select Pioneer Outdoor Services and open Contacts.

- [ ] New website submission appears under Pioneer Outdoor Services only.
- [ ] Service request is visibly marked with the Service Request badge.
- [ ] Address/service details are searchable because the request message is indexed.
- [ ] View Details shows the full request summary without truncation.
- [ ] Status can move New → In Progress → Resolved.
- [ ] Create Customer succeeds once and does not duplicate the customer if repeated.
- [ ] Contact status changes are reflected after conversion.

## SEO / legal / production

- [ ] `CNAME` is `pioneeroutdoorservices.com`.
- [ ] `robots.txt` loads and points to the production sitemap.
- [ ] `sitemap.xml` contains homepage, services, and privacy URLs on the production domain.
- [ ] Canonical/Open Graph metadata resolves to the current production URL in-browser.
- [ ] LocalBusiness structured data is present.
- [ ] Privacy page accurately describes current website collection and use.
- [ ] HTTPS is valid on the root production hostname.
- [ ] Public API requests from the root production hostname are accepted by CORS/origin integrity checks.

## Release rule

P0 is launch-ready when every unchecked item above has been manually verified against the live production hostname after the latest backend and Pages deployments.
