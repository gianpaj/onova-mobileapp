// @flow

type Status = 'authorized' | 'denied' | 'restricted' | 'undetermined';

class Permissions {
  check = (): Promise<Status> => {
    return Promise.resolve('authorized');
  };
}

export default new Permissions();
