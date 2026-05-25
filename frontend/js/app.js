const App = {
  init() {
    State.init();

    Router.register('/login', (container) => {
      LoginPage.render(container);
    });
    Router.register('/dashboard', (container) => {
      DashboardPage.render(container);
    });
    Router.register('/models', (container) => {
      ModelsPage.render(container);
    });
    Router.register('/iot', (container) => {
      IoTPage.render(container);
    });
    Router.register('/spatial', (container) => {
      SpatialPage.render(container);
    });
    Router.register('/events', (container) => {
      EventsPage.render(container);
    });
    Router.register('/business', (container) => {
      BusinessPage.render(container);
    });
    Router.register('/scenes', (container) => {
      ScenesPage.render(container);
    });
    Router.register('/viewer', (container, params) => {
      ViewerPage.render(container, params);
    });
    Router.register('/tasks', (container) => {
      TasksPage.render(container);
    });
    Router.register('/users', (container) => {
      UsersPage.render(container);
    });

    Router.init();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
