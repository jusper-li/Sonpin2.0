/* Seed store images from the live site */

update public.stores
set images = array['/upload/store/176658681630.jpg']::text[]
where city = '永和';

update public.stores
set images = array['/upload/store/154079773487.jpg']::text[]
where city = '萬華';

update public.stores
set images = array['/upload/store/154079805960.jpg']::text[]
where city = '士林';

update public.stores
set images = array['/upload/store/154079842094.jpg']::text[]
where city = '民生';

update public.stores
set images = array['/upload/store/154079864952.jpg']::text[]
where city = '新埔';

update public.stores
set images = array['/upload/store/154079894097.jpg']::text[]
where city = '新店';
