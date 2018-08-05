// @flow

type Status = 'authorized' | 'denied' | 'restricted' | 'undetermined';

class Permissions {
  check = (permission: string): Promise<Status> => {
    return Promise.resolve('authorized');
  };
}

export default new Permissions();
