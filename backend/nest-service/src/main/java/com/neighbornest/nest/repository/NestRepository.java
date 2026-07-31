package com.neighbornest.nest.repository;

import com.neighbornest.nest.entity.Nest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for {@link Nest} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface NestRepository extends JpaRepository<Nest, Long> {
}
